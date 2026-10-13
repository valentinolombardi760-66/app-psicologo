import React, { useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, shadow } from '../theme';
import { FadeIn, PressScale } from '../components/anim';
import { Avatar, Button, Card, Empty, Fab, Header, IconButton, Pill } from '../components/ui';
import { Screen } from '../components/ui';
import { useStore } from '../storage/store';
import { useNav } from '../nav';
import { addDays, DAYS_SHORT, euro, fmtLongDate, fmtMonth, fmtTime, fullName, initials, sameDay, startOfWeek, toISODate } from '../utils/format';
import { STATUS_COLOR, TYPE_LABEL } from '../utils/labels';

export { STATUS_COLOR };

export default function AgendaScreen() {
  const { db, saveAppointment } = useStore();
  const nav = useNav();
  const [selected, setSelected] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const slide = useRef(new Animated.Value(0)).current;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const moveWeek = (dir: number) => {
    Animated.timing(slide, { toValue: -dir * 40, duration: 120, useNativeDriver: Platform.OS !== 'web' }).start(() => {
      setWeekStart((w) => addDays(w, dir * 7));
      setSelected((s) => addDays(s, dir * 7));
      slide.setValue(dir * 40);
      Animated.spring(slide, { toValue: 0, useNativeDriver: Platform.OS !== 'web', speed: 20 }).start();
    });
  };

  const goToday = () => {
    setWeekStart(startOfWeek(new Date()));
    setSelected(new Date());
  };

  const countByDay = useMemo(() => {
    const m: Record<string, number> = {};
    db.appointments.forEach((a) => {
      if (a.status === 'annullato') return;
      const k = toISODate(new Date(a.start));
      m[k] = (m[k] ?? 0) + 1;
    });
    return m;
  }, [db.appointments]);

  const dayAppts = db.appointments
    .filter((a) => sameDay(new Date(a.start), selected))
    .sort((a, b) => a.start.localeCompare(b.start));

  const dayIncome = dayAppts.filter((a) => a.status === 'svolto').reduce((t, a) => t + a.fee, 0);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Header
          title="Agenda"
          subtitle={fmtMonth(selected).replace(/^./, (c) => c.toUpperCase())}
          right={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <IconButton icon="chevron-back" onPress={() => moveWeek(-1)} label="Settimana precedente" />
              <IconButton icon="today-outline" onPress={goToday} label="Oggi" color={colors.primary} />
              <IconButton icon="chevron-forward" onPress={() => moveWeek(1)} label="Settimana successiva" />
            </View>
          }
        />

        <Animated.View style={[styles.week, { transform: [{ translateX: slide }] }]}>
          {days.map((d, i) => {
            const on = sameDay(d, selected);
            const isToday = sameDay(d, new Date());
            const n = countByDay[toISODate(d)] ?? 0;
            return (
              <PressScale key={i} onPress={() => setSelected(d)} style={[styles.day, on && styles.dayOn]}>
                <Text style={[styles.dayName, on && { color: 'rgba(255,255,255,0.8)' }]}>{DAYS_SHORT[d.getDay()]}</Text>
                <Text style={[styles.dayNum, on && { color: '#fff' }, !on && isToday && { color: colors.primary }]}>{d.getDate()}</Text>
                <View style={{ flexDirection: 'row', gap: 2, height: 6 }}>
                  {Array.from({ length: Math.min(n, 3) }).map((_, k) => (
                    <View key={k} style={[styles.pip, { backgroundColor: on ? '#fff' : colors.primary }]} />
                  ))}
                </View>
              </PressScale>
            );
          })}
        </Animated.View>

        <FadeIn key={toISODate(selected)} style={{ marginTop: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[font.h2, { flex: 1, textTransform: 'capitalize' }]}>{fmtLongDate(selected)}</Text>
            {dayIncome > 0 && <Pill text={euro(dayIncome)} color={colors.sage} />}
          </View>

          {dayAppts.length === 0 ? (
            <Empty
              title="Giornata libera"
              text="Nessuna seduta in programma. Tocca + per aggiungerne una."
              action={<Button title="Programma seduta" icon="add" variant="soft" onPress={() => nav.navigate('AppointmentForm', { date: toISODate(selected) })} />}
            />
          ) : (
            dayAppts.map((a, i) => {
              const p = db.patients.find((x) => x.id === a.patientId);
              const end = new Date(new Date(a.start).getTime() + a.duration * 60000);
              return (
                <FadeIn key={a.id} index={i} style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ alignItems: 'center', width: 48 }}>
                    <Text style={{ fontWeight: '800', color: colors.ink }}>{fmtTime(a.start)}</Text>
                    <Text style={font.small}>{fmtTime(end.toISOString())}</Text>
                    <View style={styles.line} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Card onPress={() => nav.navigate('AppointmentForm', { id: a.id })} style={[{ borderLeftWidth: 4, borderLeftColor: p?.color ?? colors.primary }, a.status === 'annullato' && { opacity: 0.55 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Avatar text={initials(p)} color={p?.color ?? colors.primary} size={38} />
                        <View style={{ flex: 1 }}>
                          <Text style={font.h3}>{fullName(p)}</Text>
                          <Text style={font.small}>{TYPE_LABEL[a.type]}</Text>
                        </View>
                        <Pill text={a.status} color={STATUS_COLOR[a.status]} />
                      </View>
                      {a.status === 'programmato' && (
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                          <QuickAction icon="checkmark-circle" label="Svolta" color={colors.sage} onPress={() => saveAppointment({ ...a, status: 'svolto' })} />
                          <QuickAction icon="close-circle" label="Assente" color={colors.danger} onPress={() => saveAppointment({ ...a, status: 'assente' })} />
                          <QuickAction icon="create" label="Nota" color={colors.primary} onPress={() => nav.navigate('NoteForm', { patientId: a.patientId, appointmentId: a.id })} />
                        </View>
                      )}
                    </Card>
                  </View>
                </FadeIn>
              );
            })
          )}
        </FadeIn>
      </Screen>
      <Fab onPress={() => nav.navigate('AppointmentForm', { date: toISODate(selected) })} />
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; color: string; onPress: () => void }) {
  return (
    <PressScale onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: color + '1A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 }}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={{ color, fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.lg, padding: 8, ...shadow },
  day: { alignItems: 'center', paddingVertical: 10, borderRadius: 16, width: 44 },
  dayOn: { backgroundColor: colors.primary },
  dayName: { fontSize: 11, color: colors.muted, fontWeight: '700' },
  dayNum: { fontSize: 18, fontWeight: '800', color: colors.ink, marginVertical: 4 },
  pip: { width: 5, height: 5, borderRadius: 3 },
  line: { flex: 1, width: 2, backgroundColor: colors.line, marginTop: 6, borderRadius: 1 },
});
