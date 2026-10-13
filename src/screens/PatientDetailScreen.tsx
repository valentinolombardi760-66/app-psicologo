import React, { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, shadow } from '../theme';
import { FadeIn, PressScale } from '../components/anim';
import { Avatar, Button, Card, Empty, Header, IconButton, IconName, Pill, Screen, Segmented } from '../components/ui';
import { useStore } from '../storage/store';
import { ScreenProps } from '../nav';
import { age, euro, fmtDate, fmtTime, fullName, initials, waNumber } from '../utils/format';
import { MOODS, STATUS_COLOR, TYPE_LABEL } from '../utils/labels';
import { confirm } from '../utils/confirm';

type Tab = 'scheda' | 'sedute' | 'diario' | 'ricevute';

export default function PatientDetailScreen({ navigation, route }: ScreenProps<'PatientDetail'>) {
  const { db, deletePatient } = useStore();
  const [tab, setTab] = useState<Tab>('scheda');
  const p = db.patients.find((x) => x.id === route.params.id);
  if (!p) return <Screen><Header title="Paziente" onBack={() => navigation.goBack()} /><Empty title="Paziente non trovato" text="Potrebbe essere stato eliminato." /></Screen>;

  const appts = db.appointments.filter((a) => a.patientId === p.id).sort((a, b) => b.start.localeCompare(a.start));
  const notes = db.notes.filter((n) => n.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date));
  const receipts = db.receipts.filter((r) => r.patientId === p.id).sort((a, b) => b.date.localeCompare(a.date));
  const done = appts.filter((a) => a.status === 'svolto');
  const unbilled = done.filter((a) => !a.receiptId);
  const paidTotal = receipts.filter((r) => !r.cancelled).reduce((t, r) => t + r.total, 0);

  const contact: { icon: IconName; label: string; onPress?: () => void }[] = [
    { icon: 'call', label: 'Chiama', onPress: p.phone ? () => Linking.openURL(`tel:${p.phone}`) : undefined },
    { icon: 'logo-whatsapp', label: 'WhatsApp', onPress: p.phone ? () => Linking.openURL(`https://wa.me/${waNumber(p.phone)}`) : undefined },
    { icon: 'mail', label: 'Email', onPress: p.email ? () => Linking.openURL(`mailto:${p.email}`) : undefined },
  ];

  return (
    <Screen>
      <Header
        title=""
        onBack={() => navigation.goBack()}
        right={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <IconButton icon="create-outline" label="Modifica" onPress={() => navigation.navigate('PatientForm', { id: p.id })} />
            <IconButton
              icon="trash-outline"
              color={colors.danger}
              label="Elimina"
              onPress={() =>
                confirm('Eliminare il paziente?', 'Verranno eliminate anche sedute e note. Le ricevute restano archiviate (obbligo di conservazione 10 anni). Per un percorso concluso è meglio archiviare.', () => {
                  deletePatient(p.id);
                  navigation.goBack();
                }, 'Elimina')
              }
            />
          </View>
        }
      />

      <FadeIn>
        <LinearGradient colors={[p.color, p.color + 'AA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={styles.bigAvatar}><Text style={{ color: p.color, fontSize: 26, fontWeight: '800' }}>{initials(p)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{fullName(p)}</Text>
              <Text style={styles.heroSub}>
                {[age(p.birthDate) !== undefined ? `${age(p.birthDate)} anni` : null, p.taxCode || null].filter(Boolean).join(' · ') || 'Dati anagrafici incompleti'}
              </Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            <HeroStat label="Sedute" value={String(done.length)} />
            <HeroStat label="Da fatturare" value={String(unbilled.length)} />
            <HeroStat label="Fatturato" value={euro(paidTotal)} />
          </View>
        </LinearGradient>
      </FadeIn>

      <View style={{ flexDirection: 'row', gap: 10, marginVertical: 14 }}>
        {contact.map((c, i) => (
          <FadeIn key={c.label} index={i + 1} style={{ flex: 1 }}>
            <PressScale onPress={c.onPress} style={[styles.contact, !c.onPress && { opacity: 0.4 }]}>
              <Ionicons name={c.icon} size={20} color={colors.primary} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.ink, marginTop: 4 }}>{c.label}</Text>
            </PressScale>
          </FadeIn>
        ))}
      </View>

      <Segmented options={['scheda', 'sedute', 'diario', 'ricevute'] as const} value={tab} onChange={setTab} />

      {tab === 'scheda' && (
        <>
          {(!p.consentInformed || !p.consentPrivacy) && (
            <Card index={0} style={{ backgroundColor: colors.dangerSoft }}>
              <Text style={{ color: colors.danger, fontWeight: '700' }}>Consensi mancanti</Text>
              <Text style={[font.small, { marginTop: 4 }]}>
                {!p.consentInformed ? 'Consenso informato non registrato. ' : ''}
                {!p.consentPrivacy ? 'Informativa privacy non registrata.' : ''}
              </Text>
            </Card>
          )}
          <Info index={1} label="Motivo della richiesta" value={p.reason} />
          <Info index={2} label="Anamnesi" value={p.anamnesis} />
          <Info index={3} label="Inviante" value={p.referral} />
          <Info index={4} label="Contatti" value={[p.phone, p.email, p.address].filter(Boolean).join('\n')} />
          {p.isMinor && <Info index={5} label="Genitore / tutore" value={`${p.guardianName}\n${p.guardianTaxCode}`} />}
          <Info index={6} label="Consensi" value={`Consenso informato: ${p.consentInformed ? 'sì' : 'no'}\nPrivacy: ${p.consentPrivacy ? 'sì' : 'no'}${p.consentDate ? `\nFirmati il ${fmtDate(p.consentDate)}` : ''}\nOpposizione Sistema TS: ${p.stsOpposition ? 'sì' : 'no'}`} />
          <Info index={7} label="Tariffa" value={euro(p.rate ?? db.settings.defaultRate)} />
        </>
      )}

      {tab === 'sedute' && (
        <>
          <Button title="Nuova seduta" icon="add" variant="soft" onPress={() => navigation.navigate('AppointmentForm', { patientId: p.id })} style={{ marginBottom: 12 }} />
          {unbilled.length > 0 && (
            <Button title={`Crea ricevuta per ${unbilled.length} sedute`} icon="receipt" variant="sage" onPress={() => navigation.navigate('ReceiptForm', { patientId: p.id, appointmentIds: unbilled.map((a) => a.id) })} style={{ marginBottom: 12 }} />
          )}
          {appts.length === 0 && <Empty title="Nessuna seduta" text="Le sedute programmate e svolte compariranno qui." />}
          {appts.map((a, i) => (
            <Card key={a.id} index={i} onPress={() => navigation.navigate('AppointmentForm', { id: a.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.dot, { backgroundColor: STATUS_COLOR[a.status] }]} />
              <View style={{ flex: 1 }}>
                <Text style={font.h3}>{fmtDate(a.start)} · {fmtTime(a.start)}</Text>
                <Text style={font.small}>{TYPE_LABEL[a.type]} · {euro(a.fee)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Pill text={a.status} color={STATUS_COLOR[a.status]} />
                {a.status === 'svolto' && <Pill text={a.receiptId ? 'Ricevuta' : 'Da fatturare'} color={a.receiptId ? colors.sage : colors.sun} />}
              </View>
            </Card>
          ))}
        </>
      )}

      {tab === 'diario' && (
        <>
          <Button title="Nuova nota clinica" icon="create" variant="soft" onPress={() => navigation.navigate('NoteForm', { patientId: p.id })} style={{ marginBottom: 12 }} />
          {notes.length === 0 && <Empty title="Diario vuoto" text="Annota temi emersi, obiettivi e compiti tra una seduta e l'altra." />}
          {notes.length > 1 && <MoodTrend moods={notes.slice(0, 12).reverse().map((n) => n.mood)} />}
          {notes.map((n, i) => {
            const m = MOODS[n.mood - 1] ?? MOODS[2];
            return (
              <Card key={n.id} index={i} onPress={() => navigation.navigate('NoteForm', { id: n.id, patientId: p.id })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Ionicons name={m.icon as IconName} size={18} color={m.color} />
                  <Text style={font.h3}>{fmtDate(n.date)}</Text>
                  <Text style={font.small}>· {m.label}</Text>
                </View>
                <Text style={font.body} numberOfLines={4}>{n.content || '—'}</Text>
                {n.homework ? <Text style={[font.small, { marginTop: 6 }]}>Compito: {n.homework}</Text> : null}
              </Card>
            );
          })}
        </>
      )}

      {tab === 'ricevute' && (
        <>
          {receipts.length === 0 && <Empty title="Nessuna ricevuta" text="Le ricevute emesse per questo paziente compariranno qui." />}
          {receipts.map((r, i) => (
            <Card key={r.id} index={i} onPress={() => navigation.navigate('ReceiptDetail', { id: r.id })} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={font.h3}>N. {r.number}/{r.year}</Text>
                <Text style={font.small}>{fmtDate(r.date)}</Text>
              </View>
              {r.cancelled ? <Pill text="Annullata" color={colors.muted} /> : <Text style={[font.h3, { color: colors.primary }]}>{euro(r.total)}</Text>}
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>{value}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>{label}</Text>
    </View>
  );
}

function Info({ label, value, index }: { label: string; value?: string; index: number }) {
  return (
    <Card index={index}>
      <Text style={[font.tiny, { marginBottom: 4 }]}>{label.toUpperCase()}</Text>
      <Text style={font.body}>{value?.trim() ? value : '—'}</Text>
    </Card>
  );
}

/** Piccolo grafico a barre dell'andamento dell'umore nelle ultime sedute. */
function MoodTrend({ moods }: { moods: number[] }) {
  return (
    <Card index={0}>
      <Text style={[font.tiny, { marginBottom: 10 }]}>ANDAMENTO UMORE (ULTIME NOTE)</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 70, gap: 6 }}>
        {moods.map((m, i) => (
          <FadeIn key={i} index={i} style={{ flex: 1, height: `${(m / 5) * 100}%` }} from={30}>
            <View style={{ flex: 1, borderRadius: 6, backgroundColor: MOODS[m - 1]?.color ?? colors.muted }} />
          </FadeIn>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.xl, padding: 20, ...shadow, shadowOpacity: 0.18 },
  bigAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  name: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  heroStats: { flexDirection: 'row', marginTop: 18, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, padding: 12 },
  contact: { backgroundColor: colors.card, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', ...shadow },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
