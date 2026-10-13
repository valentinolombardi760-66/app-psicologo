import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, gradients, radius, shadow } from '../theme';
import { CountUp, FadeIn, PressScale } from '../components/anim';
import { MindHead } from '../components/art';
import { Avatar, Card, IconName, Pill, Screen, SectionTitle } from '../components/ui';
import { useStore } from '../storage/store';
import { useNav } from '../nav';
import { euro, fmtLongDate, fmtTime, fullName, greeting, initials, quoteOfDay, sameDay } from '../utils/format';
import { STATUS_COLOR } from '../utils/labels';

export default function HomeScreen() {
  const { db } = useStore();
  const nav = useNav();
  const now = new Date();
  const name = db.settings.profile.fullName.split(' ')[0];

  const data = useMemo(() => {
    const todayAppts = db.appointments
      .filter((a) => sameDay(new Date(a.start), now) && a.status !== 'annullato')
      .sort((a, b) => a.start.localeCompare(b.start));
    const month = db.receipts.filter((r) => !r.cancelled && r.date.slice(0, 7) === now.toISOString().slice(0, 7));
    const toBill = db.appointments.filter((a) => a.status === 'svolto' && !a.receiptId);
    const unpaid = toBill.reduce((t, a) => t + a.fee, 0);
    const active = db.patients.filter((p) => !p.archived);
    const missingConsent = active.filter((p) => !p.consentInformed || !p.consentPrivacy);
    const weekAhead = db.appointments.filter((a) => {
      const d = new Date(a.start).getTime();
      return d > now.getTime() && d < now.getTime() + 7 * 864e5 && a.status === 'programmato';
    }).length;
    const unsentSts = db.receipts.filter((r) => !r.cancelled && !r.stsSent && r.year < now.getFullYear()).length;
    return { todayAppts, monthIncome: month.reduce((t, r) => t + r.total, 0), toBill, unpaid, active, missingConsent, weekAhead, unsentSts };
  }, [db]);

  const quick: { icon: IconName; label: string; color: string; onPress: () => void }[] = [
    { icon: 'person-add', label: 'Paziente', color: colors.primary, onPress: () => nav.navigate('PatientForm', {}) },
    { icon: 'calendar', label: 'Seduta', color: colors.sage, onPress: () => nav.navigate('AppointmentForm', {}) },
    { icon: 'receipt', label: 'Ricevuta', color: colors.peach, onPress: () => nav.navigate('ReceiptForm', {}) },
    { icon: 'leaf', label: 'Respira', color: colors.sky, onPress: () => nav.navigate('Breathing') },
  ];

  return (
    <Screen>
      <FadeIn>
        <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroSmall}>{fmtLongDate(now)}</Text>
            <Text style={styles.heroTitle}>{greeting()}{name ? `,\n${db.settings.profile.title} ${name}` : ''}</Text>
            <View style={styles.quote}>
              <Ionicons name="sparkles" size={13} color="#fff" />
              <Text style={styles.quoteText}>{quoteOfDay()}</Text>
            </View>
          </View>
          <View style={{ marginRight: -18, marginBottom: -18 }}>
            <MindHead size={130} />
          </View>
        </LinearGradient>
      </FadeIn>

      <View style={styles.quickRow}>
        {quick.map((q, i) => (
          <FadeIn key={q.label} index={i + 1} style={{ flex: 1 }}>
            <PressScale onPress={q.onPress} style={styles.quick}>
              <View style={[styles.quickIcon, { backgroundColor: q.color + '1F' }]}>
                <Ionicons name={q.icon} size={22} color={q.color} />
              </View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </PressScale>
          </FadeIn>
        ))}
      </View>

      <View style={styles.stats}>
        <Stat index={5} label="Pazienti attivi" value={data.active.length} color={colors.primary} icon="people" />
        <Stat index={6} label="Sedute in 7 giorni" value={data.weekAhead} color={colors.sage} icon="time" />
        <Stat index={7} label="Incassato nel mese" value={data.monthIncome} money color={colors.peach} icon="wallet" />
        <Stat index={8} label="Da fatturare" value={data.unpaid} money color={colors.sun} icon="hourglass" />
      </View>

      {(data.missingConsent.length > 0 || data.toBill.length > 0 || data.unsentSts > 0) && <SectionTitle>Da sistemare</SectionTitle>}
      {data.toBill.length > 0 && (
        <Alert index={9} icon="receipt-outline" color={colors.sun} text={data.toBill.length === 1 ? '1 seduta svolta senza ricevuta' : `${data.toBill.length} sedute svolte senza ricevuta`} onPress={() => nav.navigate('ReceiptForm', {})} />
      )}
      {data.missingConsent.length > 0 && (
        <Alert index={10} icon="document-text-outline" color={colors.danger} text={data.missingConsent.length === 1 ? '1 paziente senza consenso informato o privacy' : `${data.missingConsent.length} pazienti senza consenso informato o privacy`} onPress={() => nav.navigate('PatientDetail', { id: data.missingConsent[0].id })} />
      )}
      {data.unsentSts > 0 && (
        <Alert index={11} icon="cloud-upload-outline" color={colors.sky} text={`${data.unsentSts} ricevute dell'anno scorso non segnate come inviate al Sistema TS`} onPress={() => nav.navigate('Tabs', { screen: 'Ricevute' } as any)} />
      )}

      <SectionTitle right={<Text style={[font.small, { color: colors.primary, fontWeight: '700' }]} onPress={() => nav.navigate('Tabs', { screen: 'Agenda' } as any)}>Agenda</Text>}>
        Oggi
      </SectionTitle>
      {data.todayAppts.length === 0 ? (
        <Card index={12} style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Ionicons name="sunny-outline" size={30} color={colors.sun} />
          <Text style={[font.body, { marginTop: 8, fontWeight: '600' }]}>Nessuna seduta oggi</Text>
          <Text style={font.small}>Un buon momento per aggiornare il diario clinico.</Text>
        </Card>
      ) : (
        data.todayAppts.map((a, i) => {
          const p = db.patients.find((x) => x.id === a.patientId);
          return (
            <Card key={a.id} index={12 + i} onPress={() => nav.navigate('AppointmentForm', { id: a.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.timeBox}>
                <Text style={{ fontWeight: '800', color: colors.primary, fontSize: 16 }}>{fmtTime(a.start)}</Text>
                <Text style={font.small}>{a.duration}'</Text>
              </View>
              <Avatar text={initials(p)} color={p?.color ?? colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={font.h3}>{fullName(p)}</Text>
                <Text style={font.small}>{a.type}</Text>
              </View>
              <Pill text={a.status} color={STATUS_COLOR[a.status]} />
            </Card>
          );
        })
      )}
    </Screen>
  );
}

function Stat({ label, value, money, color, icon, index }: { label: string; value: number; money?: boolean; color: string; icon: IconName; index: number }) {
  return (
    <FadeIn index={index} style={styles.statWrap}>
      <View style={styles.stat}>
        <View style={[styles.statIcon, { backgroundColor: color + '1F' }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <CountUp value={value} format={(n) => (money ? euro(n) : String(Math.round(n)))} style={styles.statValue} />
        <Text style={font.small}>{label}</Text>
      </View>
    </FadeIn>
  );
}

function Alert({ icon, color, text, onPress, index }: { icon: IconName; color: string; text: string; onPress: () => void; index: number }) {
  return (
    <Card index={index} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <View style={[styles.statIcon, { backgroundColor: color + '1F', marginBottom: 0 }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[font.body, { flex: 1 }]}>{text}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.xl, padding: 22, flexDirection: 'row', overflow: 'hidden', minHeight: 190, ...shadow, shadowOpacity: 0.2 },
  heroSmall: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  heroTitle: { color: '#fff', fontSize: 25, fontWeight: '800', marginTop: 6, letterSpacing: -0.4 },
  quote: { flexDirection: 'row', gap: 6, marginTop: 16, backgroundColor: 'rgba(255,255,255,0.18)', padding: 10, borderRadius: 14, alignItems: 'flex-start' },
  quoteText: { color: '#fff', fontSize: 12.5, flex: 1, fontStyle: 'italic' },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  quick: { backgroundColor: colors.card, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', ...shadow },
  quickIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickLabel: { fontSize: 12, fontWeight: '700', color: colors.ink },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  statWrap: { width: '48.5%', flexGrow: 1 },
  stat: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, ...shadow },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  timeBox: { alignItems: 'center', width: 52 },
});
