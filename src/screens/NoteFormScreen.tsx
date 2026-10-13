import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font } from '../theme';
import { FadeIn, PressScale } from '../components/anim';
import { Button, Card, DateField, Field, Header, Screen, SectionTitle } from '../components/ui';
import { newId, useStore } from '../storage/store';
import { ScreenProps } from '../nav';
import { fullName, toISODate, today } from '../utils/format';
import { MOODS } from '../utils/labels';
import { confirm } from '../utils/confirm';

export default function NoteFormScreen({ navigation, route }: ScreenProps<'NoteForm'>) {
  const { db, saveNote, deleteNote } = useStore();
  const existing = db.notes.find((n) => n.id === route.params.id);
  const appt = db.appointments.find((a) => a.id === (existing?.appointmentId ?? route.params.appointmentId));
  const patient = db.patients.find((p) => p.id === route.params.patientId);
  const [date, setDate] = useState(existing?.date ?? (appt ? toISODate(new Date(appt.start)) : today()));
  const [mood, setMood] = useState(existing?.mood ?? 3);
  const [content, setContent] = useState(existing?.content ?? '');
  const [goals, setGoals] = useState(existing?.goals ?? '');
  const [homework, setHomework] = useState(existing?.homework ?? '');

  // Riprende obiettivi e compiti dall'ultima nota, per continuità
  const last = db.notes.filter((n) => n.patientId === route.params.patientId && n.id !== existing?.id).sort((a, b) => b.date.localeCompare(a.date))[0];

  const save = () => {
    saveNote({
      id: existing?.id ?? newId(),
      patientId: route.params.patientId,
      appointmentId: existing?.appointmentId ?? route.params.appointmentId,
      date,
      mood,
      content,
      goals,
      homework,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    navigation.goBack();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title={existing ? 'Nota clinica' : 'Nuova nota'} subtitle={fullName(patient)} onBack={() => navigation.goBack()} />
      <FadeIn index={1}>
        <Card>
          <DateField label="Data" value={date} onChange={setDate} />
          <Text style={[font.tiny, { marginBottom: 10 }]}>CLIMA DELLA SEDUTA</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {MOODS.map((m, i) => {
              const on = mood === i + 1;
              return (
                <PressScale key={m.label} onPress={() => setMood(i + 1)} style={{ alignItems: 'center', width: 60 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? m.color : m.color + '1A', transform: [{ scale: on ? 1.1 : 1 }] }}>
                    <Ionicons name={m.icon as any} size={22} color={on ? '#fff' : m.color} />
                  </View>
                  <Text style={{ fontSize: 10, color: on ? m.color : colors.muted, marginTop: 4, fontWeight: '700', textAlign: 'center' }}>{m.label}</Text>
                </PressScale>
              );
            })}
          </View>
        </Card>
      </FadeIn>

      {!existing && last && (last.goals || last.homework) ? (
        <FadeIn index={2}>
          <Card style={{ backgroundColor: colors.primarySoft }}>
            <Text style={[font.tiny, { color: colors.primary, marginBottom: 4 }]}>DALLA NOTA PRECEDENTE</Text>
            {last.goals ? <Text style={font.small}>Obiettivi: {last.goals}</Text> : null}
            {last.homework ? <Text style={font.small}>Compito: {last.homework}</Text> : null}
          </Card>
        </FadeIn>
      ) : null}

      <FadeIn index={3}>
        <SectionTitle>Contenuto</SectionTitle>
        <Card>
          <Field label="Temi emersi e osservazioni" value={content} onChangeText={setContent} multiline style={{ minHeight: 160 }} />
          <Field label="Obiettivi di lavoro" value={goals} onChangeText={setGoals} multiline />
          <Field label="Compiti / esercizi tra le sedute" value={homework} onChangeText={setHomework} multiline />
        </Card>
      </FadeIn>

      <Button title="Salva nota" icon="checkmark" onPress={save} style={{ marginTop: 16 }} />
      {existing && (
        <Button title="Elimina nota" icon="trash" variant="danger" style={{ marginTop: 10 }} onPress={() => confirm('Eliminare la nota?', 'L’operazione non si può annullare.', () => { deleteNote(existing.id); navigation.goBack(); }, 'Elimina')} />
      )}
    </Screen>
  );
}
