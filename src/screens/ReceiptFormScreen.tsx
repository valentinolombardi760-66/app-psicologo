import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius } from '../theme';
import { FadeIn, PressScale } from '../components/anim';
import { Button, Card, DateField, Field, Header, Row, Screen, SectionTitle, Segmented } from '../components/ui';
import { PatientPicker } from '../components/PatientPicker';
import { newId, useStore } from '../storage/store';
import { ScreenProps } from '../nav';
import { amountInput, euro, fmtDate, parseAmount, today } from '../utils/format';
import { TYPE_LABEL } from '../utils/labels';
import { computeReceipt, PAYMENT_LABEL, STAMP_THRESHOLD } from '../utils/receipt';
import { PaymentMethod, ReceiptItem } from '../types';
import { notify } from '../utils/confirm';

const METHODS: readonly PaymentMethod[] = ['carta', 'bonifico', 'contanti', 'bonus'];

export default function ReceiptFormScreen({ navigation, route }: ScreenProps<'ReceiptForm'>) {
  const { db, saveReceipt, nextReceiptNumber } = useStore();
  const s = db.settings;
  const [patientId, setPatientId] = useState(route.params?.patientId);
  const [selected, setSelected] = useState<string[]>(route.params?.appointmentIds ?? []);
  const [extra, setExtra] = useState<{ description: string; amount: string }[]>([]);
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState<PaymentMethod>('carta');
  const [bonusCode, setBonusCode] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');

  const patient = db.patients.find((p) => p.id === patientId);
  const billable = db.appointments
    .filter((a) => a.patientId === patientId && !a.receiptId && (a.status === 'svolto' || a.status === 'assente'))
    .sort((a, b) => a.start.localeCompare(b.start));

  const items: ReceiptItem[] = useMemo(() => {
    const fromAppts = billable
      .filter((a) => selected.includes(a.id))
      .map((a) => ({
        description: `${a.status === 'assente' ? 'Seduta non disdetta' : `Prestazione sanitaria – ${TYPE_LABEL[a.type]}`} del ${fmtDate(a.start)}`,
        amount: a.fee,
      }));
    return [...fromAppts, ...extra.filter((e) => e.description.trim()).map((e) => ({ description: e.description, amount: parseAmount(e.amount) }))];
  }, [billable, selected, extra]);

  const calc = computeReceipt(items, s);
  const year = Number(date.slice(0, 4));
  const number = nextReceiptNumber(year);

  const save = () => {
    if (!patient) return notify('Manca il paziente', 'Seleziona il paziente intestatario.');
    if (!items.length || calc.subtotal <= 0) return notify('Ricevuta vuota', 'Seleziona almeno una seduta o aggiungi una voce.');
    if (!patient.taxCode) notify('Attenzione', 'Il paziente non ha il codice fiscale: è necessario per il Sistema Tessera Sanitaria.');
    const id = newId();
    saveReceipt({
      id,
      number,
      year,
      date,
      patientId: patient.id,
      items,
      subtotal: calc.subtotal,
      enpap: calc.enpap,
      stamp: calc.stamp,
      total: calc.total,
      paymentMethod: method,
      bonusCode,
      bonusAmount: parseAmount(bonusAmount),
      stsSent: false,
      appointmentIds: selected.filter((sid) => billable.some((a) => a.id === sid)),
      regime: s.regime,
      cancelled: false,
    });
    navigation.replace('ReceiptDetail', { id });
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Nuova ricevuta" subtitle={`N. ${number}/${year}`} onBack={() => navigation.goBack()} />
      <FadeIn index={1}>
        <Card>
          <PatientPicker value={patientId} onChange={(id) => { setPatientId(id); setSelected([]); }} label="Intestatario" />
          {patient?.isMinor && patient.guardianName ? <Text style={[font.small, { marginTop: -6, marginBottom: 10 }]}>Intestata a {patient.guardianName} (genitore/tutore)</Text> : null}
          <DateField label="Data ricevuta" value={date} onChange={setDate} />
        </Card>
      </FadeIn>

      {patientId && (
        <FadeIn index={2}>
          <SectionTitle>Sedute da fatturare</SectionTitle>
          {billable.length === 0 && <Text style={[font.small, { marginBottom: 10 }]}>Nessuna seduta svolta senza ricevuta. Puoi aggiungere una voce manuale.</Text>}
          {billable.map((a) => {
            const on = selected.includes(a.id);
            return (
              <PressScale key={a.id} onPress={() => setSelected((x) => (on ? x.filter((y) => y !== a.id) : [...x, a.id]))} style={[styles.row, on && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}>
                <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? colors.primary : colors.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={font.h3}>{fmtDate(a.start)}</Text>
                  <Text style={font.small}>{a.status === 'assente' ? 'Assenza non disdetta' : TYPE_LABEL[a.type]}</Text>
                </View>
                <Text style={font.h3}>{euro(a.fee)}</Text>
              </PressScale>
            );
          })}
          {extra.map((e, i) => (
            <Card key={i}>
              <Field label="Descrizione" value={e.description} onChangeText={(v) => setExtra((x) => x.map((y, k) => (k === i ? { ...y, description: v } : y)))} placeholder="Es. Relazione psicologica" />
              <Row>
                <View style={{ flex: 1 }}><Field label="Importo (€)" value={e.amount} onChangeText={(v) => setExtra((x) => x.map((y, k) => (k === i ? { ...y, amount: v } : y)))} keyboardType="decimal-pad" /></View>
                <Ionicons name="trash-outline" size={22} color={colors.danger} onPress={() => setExtra((x) => x.filter((_, k) => k !== i))} />
              </Row>
            </Card>
          ))}
          <Button title="Aggiungi voce manuale" icon="add" variant="ghost" onPress={() => setExtra((x) => [...x, { description: '', amount: amountInput(s.defaultRate) }])} />
        </FadeIn>
      )}

      <FadeIn index={3}>
        <SectionTitle>Pagamento</SectionTitle>
        <Card>
          <Segmented options={METHODS} value={method} onChange={setMethod} labels={PAYMENT_LABEL as any} />
          {method === 'contanti' && <Text style={[font.small, { marginBottom: 6, color: colors.danger }]}>Con pagamento in contanti il paziente non può detrarre la spesa al 19%.</Text>}
          {method === 'bonus' && (
            <>
              <Field label="Codice Bonus Psicologo" value={bonusCode} onChangeText={setBonusCode} autoCapitalize="characters" />
              <Field label="Importo coperto dal bonus (€)" value={bonusAmount} onChangeText={setBonusAmount} keyboardType="decimal-pad" />
            </>
          )}
        </Card>
      </FadeIn>

      <FadeIn index={4}>
        <View style={styles.summary}>
          <Line label="Onorario" value={euro(calc.subtotal)} />
          {s.enpap && <Line label={`Rivalsa ENPAP ${s.enpapRate}%`} value={euro(calc.enpap)} />}
          {calc.stampDue && <Line label={s.stampCharged ? 'Marca da bollo' : 'Marca da bollo (a tuo carico)'} value={euro(calc.stamp)} />}
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 10 }} />
          <Line label="Totale" value={euro(calc.total)} big />
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 8 }}>
            Esente IVA · {s.regime === 'forfettario' ? 'Regime forfettario' : 'Regime ordinario'} · bollo da 2 € sopra {euro(STAMP_THRESHOLD)}
          </Text>
        </View>
      </FadeIn>

      <Button title="Emetti ricevuta" icon="checkmark-done" onPress={save} style={{ marginTop: 16 }} />
    </Screen>
  );
}

function Line({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 }}>
      <Text style={{ color: '#fff', fontSize: big ? 18 : 14, fontWeight: big ? '800' : '500' }}>{label}</Text>
      <Text style={{ color: '#fff', fontSize: big ? 22 : 14, fontWeight: big ? '800' : '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md, padding: 14, marginBottom: 8 },
  summary: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 18, marginTop: 18 },
});
