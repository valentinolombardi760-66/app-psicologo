import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font } from '../theme';
import { Avatar, Button, Card, Empty, Fab, Header, Pill, Screen, SearchBar, Segmented } from '../components/ui';
import { useStore } from '../storage/store';
import { useNav } from '../nav';
import { age, fmtDate, fullName, initials } from '../utils/format';

export default function PatientsScreen() {
  const { db } = useStore();
  const nav = useNav();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'attivi' | 'archiviati' | 'tutti'>('attivi');

  const list = useMemo(() => {
    const s = q.toLowerCase().trim();
    return db.patients
      .filter((p) => (filter === 'tutti' ? true : filter === 'attivi' ? !p.archived : p.archived))
      .filter((p) => !s || `${p.firstName} ${p.lastName} ${p.taxCode} ${p.phone}`.toLowerCase().includes(s))
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
      .map((p) => {
        const appts = db.appointments.filter((a) => a.patientId === p.id && a.status === 'svolto');
        const last = appts.map((a) => a.start).sort().pop();
        const next = db.appointments
          .filter((a) => a.patientId === p.id && a.status === 'programmato' && new Date(a.start) > new Date())
          .map((a) => a.start)
          .sort()[0];
        return { p, count: appts.length, last, next };
      });
  }, [db, q, filter]);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Header title="Pazienti" subtitle={`${db.patients.filter((p) => !p.archived).length} in carico`} />
        <SearchBar value={q} onChange={setQ} placeholder="Cerca per nome, CF, telefono" />
        <Segmented options={['attivi', 'archiviati', 'tutti'] as const} value={filter} onChange={setFilter} />
        {list.length === 0 ? (
          <Empty
            title={q ? 'Nessun risultato' : 'Ancora nessun paziente'}
            text={q ? 'Prova con un altro termine di ricerca.' : 'Aggiungi il primo paziente per iniziare a gestire sedute, diario e ricevute.'}
            action={!q ? <Button title="Aggiungi paziente" icon="person-add" onPress={() => nav.navigate('PatientForm', {})} /> : undefined}
          />
        ) : (
          list.map(({ p, count, last, next }, i) => (
            <Card key={p.id} index={i} onPress={() => nav.navigate('PatientDetail', { id: p.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Avatar text={initials(p)} color={p.color} size={50} />
              <View style={{ flex: 1 }}>
                <Text style={font.h3}>{fullName(p)}</Text>
                <Text style={font.small}>
                  {[age(p.birthDate) !== undefined ? `${age(p.birthDate)} anni` : null, `${count} sedute`, last ? `ultima ${fmtDate(last)}` : null].filter(Boolean).join(' · ')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                  {next && <Pill text={`Prossima ${fmtDate(next)}`} color={colors.sage} />}
                  {(!p.consentInformed || !p.consentPrivacy) && <Pill text="Consensi mancanti" color={colors.danger} />}
                  {p.archived && <Pill text="Archiviato" color={colors.muted} />}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Card>
          ))
        )}
      </Screen>
      <Fab onPress={() => nav.navigate('PatientForm', {})} />
    </View>
  );
}
