import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { colors, font } from '../theme';
import { FadeIn } from '../components/anim';
import { Button, Card, DateField, Field, Header, Row, Screen, SectionTitle, Segmented, ToggleRow } from '../components/ui';
import { PatientPicker } from '../components/PatientPicker';
import { newId, useStore } from '../storage/store';
import { ScreenProps } from '../nav';
import { amountInput, euro, fmtLongDate, fmtTime, pad, parseAmount, toISODate, waNumber } from '../utils/format';
import { STATUSES, TYPES } from '../utils/labels';
import { Appointment, AppointmentStatus, AppointmentType } from '../types';
import { confirm, notify } from '../utils/confirm';

const DURATIONS = ['45', '50', '60', '90'] as const;

export default function AppointmentFormScreen({ navigation, route }: ScreenProps<'AppointmentForm'>) {
  const { db, saveAppointment, deleteAppointment } = useStore();
  const existing = db.appointments.find((a) => a.id === route.params?.id);
  const s = db.settings;

  const initialStart = existing ? new Date(existing.start) : null;
  const [patientId, setPatientId] = useState(existing?.patientId ?? route.params?.patientId);
  const [date, setDate] = useState(initialStart ? toISODate(initialStart) : route.params?.date ?? toISODate(new Date()));
  const [time, setTime] = useState(initialStart ? `${pad(initialStart.getHours())}:${pad(initialStart.getMinutes())}` : '09:00');
  const [duration, setDuration] = useState(String(existing?.duration ?? s.defaultDuration));
  const [type, setType] = useState<AppointmentType>(existing?.type ?? 'individuale');
  const [status, setStatus] = useState<AppointmentStatus>(existing?.status ?? 'programmato');
  const patient = db.patients.find((p) => p.id === patientId);
  const [fee, setFee] = useState(amountInput(existing?.fee ?? patient?.rate ?? s.defaultRate));
  const [paid, setPaid] = useState(existing?.paid ?? false);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [repeat, setRepeat] = useState('0');

  const pickPatient = (id: string) => {
    setPatientId(id);
    if (!existing) {
      const p = db.patients.find((x) => x.id === id);
      setFee(amountInput(p?.rate ?? s.defaultRate));
    }
  };

  const buildStart = (offsetWeeks = 0) => {
    const [y, m, d] = date.split('-').map(Number);
    const [h, mi] = time.split(':').map(Number);
    return new Date(y, m - 1, d + offsetWeeks * 7, h, mi).toISOString();
  };

  const conflicts = () => {
    const start = new Date(buildStart()).getTime();
    const end = start + Number(duration) * 60000;
    return db.appointments.filter((a) => {
      if (a.id === existing?.id || a.status === 'annullato') return false;
      const s2 = new Date(a.start).getTime();
      return s2 < end && s2 + a.duration * 60000 > start;
    });
  };

  const save = () => {
    if (!patientId) return notify('Manca il paziente', 'Seleziona un paziente per la seduta.');
    const doSave = () => {
      const base: Appointment = {
        id: existing?.id ?? newId(),
        patientId,
        start: buildStart(),
        duration: Number(duration) || s.defaultDuration,
        type,
        status,
        fee: parseAmount(fee),
        paid,
        receiptId: existing?.receiptId,
        notes,
      };
      saveAppointment(base);
      const n = existing ? 0 : Number(repeat);
      for (let w = 1; w <= n; w++) saveAppointment({ ...base, id: newId(), start: buildStart(w), status: 'programmato', paid: false, receiptId: undefined });
      navigation.goBack();
    };
    const c = conflicts();
    if (c.length) confirm('Sovrapposizione', `C'è già una seduta in questo orario (${fmtTime(c[0].start)}). Salvare comunque?`, doSave, 'Salva');
    else doSave();
  };

  const remind = () => {
    if (!patient?.phone) return notify('Telefono mancante', 'Aggiungi un numero di telefono nella scheda del paziente.');
    const when = new Date(buildStart());
    const text = `Gentile ${patient.firstName}, le ricordo l'appuntamento di ${fmtLongDate(when)} alle ore ${fmtTime(when.toISOString())}${type === 'online' ? ' (online)' : ''}. Per disdire la prego di avvisare almeno 24 ore prima. ${s.profile.title} ${s.profile.fullName}`;
    Linking.openURL(`https://wa.me/${waNumber(patient.phone)}?text=${encodeURIComponent(text)}`);
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title={existing ? 'Seduta' : 'Nuova seduta'} onBack={() => navigation.goBack()} />
      <FadeIn index={1}>
        <Card>
          <PatientPicker value={patientId} onChange={pickPatient} />
          <Row>
            <DateField label="Data" value={date} onChange={setDate} />
            <DateField label="Ora" mode="time" value={time} onChange={setTime} />
          </Row>
          <Text style={[font.tiny, { marginBottom: 8 }]}>DURATA (MINUTI)</Text>
          <Segmented options={DURATIONS} value={(DURATIONS as readonly string[]).includes(duration) ? (duration as any) : '50'} onChange={setDuration} labels={{ '45': "45'", '50': "50'", '60': "60'", '90': "90'" }} />
          <Text style={[font.tiny, { marginBottom: 8 }]}>TIPO</Text>
          <Segmented options={TYPES} value={type} onChange={setType} />
          <Field label="Onorario (€)" value={fee} onChangeText={setFee} keyboardType="decimal-pad" />
        </Card>
      </FadeIn>

      <FadeIn index={2}>
        <SectionTitle>Stato</SectionTitle>
        <Card>
          <Segmented options={STATUSES} value={status} onChange={setStatus} />
          {status === 'assente' && <Text style={[font.small, { marginBottom: 8 }]}>Se applichi la penale per assenza non disdetta, emetti comunque la ricevuta per l'importo dovuto.</Text>}
          <ToggleRow label="Pagata" value={paid} onChange={setPaid} />
          <View style={{ marginTop: 12 }}>
            <Field label="Note organizzative" value={notes} onChangeText={setNotes} multiline placeholder="Es. link videochiamata, citofono..." />
          </View>
          {!existing && (
            <>
              <Text style={[font.tiny, { marginBottom: 8 }]}>RIPETI OGNI SETTIMANA PER</Text>
              <Segmented options={['0', '3', '7', '11'] as const} value={repeat as any} onChange={setRepeat} labels={{ '0': 'No', '3': '+3 sett.', '7': '+7 sett.', '11': '+11 sett.' }} />
            </>
          )}
        </Card>
      </FadeIn>

      <Button title="Salva seduta" icon="checkmark" onPress={save} style={{ marginTop: 16 }} />

      {existing && (
        <FadeIn index={3}>
          <SectionTitle>Azioni</SectionTitle>
          <View style={{ gap: 10 }}>
            <Button title="Promemoria WhatsApp" icon="logo-whatsapp" variant="soft" onPress={remind} />
            <Button title="Scrivi nota clinica" icon="create" variant="soft" onPress={() => navigation.navigate('NoteForm', { patientId: existing.patientId, appointmentId: existing.id })} />
            {existing.receiptId ? (
              <Button title="Vedi ricevuta" icon="receipt" variant="soft" onPress={() => navigation.navigate('ReceiptDetail', { id: existing.receiptId! })} />
            ) : (
              <Button title={`Crea ricevuta (${euro(parseAmount(fee))})`} icon="receipt" variant="sage" onPress={() => {
                saveAppointment({ ...existing, status: status === 'programmato' ? 'svolto' : status, fee: parseAmount(fee) });
                navigation.navigate('ReceiptForm', { patientId: existing.patientId, appointmentIds: [existing.id] });
              }} />
            )}
            <Button title="Elimina seduta" icon="trash" variant="danger" onPress={() => confirm('Eliminare la seduta?', 'L’operazione non si può annullare.', () => { deleteAppointment(existing.id); navigation.goBack(); }, 'Elimina')} />
          </View>
        </FadeIn>
      )}
    </Screen>
  );
}
