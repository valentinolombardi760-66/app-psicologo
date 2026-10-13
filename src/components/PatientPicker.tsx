import React, { useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, font } from '../theme';
import { PressScale } from './anim';
import { Avatar, Card, Header, SearchBar } from './ui';
import { useStore } from '../storage/store';
import { fullName, initials } from '../utils/format';

export function PatientPicker({ value, onChange, label = 'Paziente' }: { value?: string; onChange: (id: string) => void; label?: string }) {
  const { db } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const p = db.patients.find((x) => x.id === value);
  const list = db.patients
    .filter((x) => !x.archived || x.id === value)
    .filter((x) => fullName(x).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[font.tiny, { marginBottom: 6, marginLeft: 2 }]}>{label.toUpperCase()}</Text>
      <PressScale onPress={() => setOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FBFAFE', borderWidth: 1.5, borderColor: colors.line, borderRadius: 16, padding: 10 }}>
        {p ? <Avatar text={initials(p)} color={p.color} size={36} /> : <Ionicons name="person-circle-outline" size={36} color={colors.muted} />}
        <Text style={[font.body, { flex: 1, color: p ? colors.ink : colors.muted }]}>{p ? fullName(p) : 'Seleziona paziente'}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </PressScale>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <Header title="Scegli paziente" onBack={() => setOpen(false)} />
            <SearchBar value={q} onChange={setQ} placeholder="Cerca" />
            {list.length === 0 && <Text style={font.small}>Nessun paziente. Aggiungilo prima dalla sezione Pazienti.</Text>}
            {list.map((x, i) => (
              <Card key={x.id} index={i} onPress={() => { onChange(x.id); setOpen(false); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar text={initials(x)} color={x.color} />
                <Text style={[font.h3, { flex: 1 }]}>{fullName(x)}</Text>
                {x.id === value && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
              </Card>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
