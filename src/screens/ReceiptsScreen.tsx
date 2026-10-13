import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, font, gradients, radius, shadow } from '../theme';
import { CountUp, FadeIn } from '../components/anim';
import { Avatar, Button, Card, Empty, Fab, Header, Pill, Screen, Segmented } from '../components/ui';
import { useStore } from '../storage/store';
import { useNav } from '../nav';
import { euro, fmtDate, fullName, initials } from '../utils/format';
import { stsCSV } from '../utils/receipt';
import { shareTextFile } from '../utils/share';
import { notify } from '../utils/confirm';

export default function ReceiptsScreen() {
  const { db } = useStore();
  const nav = useNav();
  const years = useMemo(() => {
    const ys = new Set(db.receipts.map((r) => String(r.year)));
    ys.add(String(new Date().getFullYear()));
    return [...ys].sort().reverse();
  }, [db.receipts]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [filter, setFilter] = useState<'tutte' | 'da inviare STS'>('tutte');

  const all = db.receipts.filter((r) => String(r.year) === year);
  const valid = all.filter((r) => !r.cancelled);
  const list = (filter === 'tutte' ? all : valid.filter((r) => !r.stsSent)).sort((a, b) => b.number - a.number);
  const total = valid.reduce((t, r) => t + r.total, 0);
  const enpap = valid.reduce((t, r) => t + r.enpap, 0);

  const exportSTS = async () => {
    if (!valid.length) return notify('Nessuna ricevuta', `Non ci sono ricevute per il ${year}.`);
    try {
      await shareTextFile(`SistemaTS_${year}.csv`, stsCSV(valid, db.patients), 'text/csv');
    } catch (e: any) {
      notify('Errore', e?.message ?? 'Esportazione non riuscita');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Header title="Ricevute" subtitle="Prestazioni sanitarie esenti IVA" />
        <Segmented options={years} value={year} onChange={setYear} labels={{}} />
        <FadeIn>
          <LinearGradient colors={gradients.sage} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius.xl, padding: 20, ...shadow }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>Fatturato {year}</Text>
            <CountUp value={total} format={euro} style={{ color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 }} />
            <View style={{ flexDirection: 'row', marginTop: 12, gap: 18 }}>
              <Mini label="Ricevute" value={String(valid.length)} />
              <Mini label="ENPAP 2%" value={euro(enpap)} />
              <Mini label="Da inviare STS" value={String(valid.filter((r) => !r.stsSent).length)} />
            </View>
          </LinearGradient>
        </FadeIn>
        <Button title="Esporta dati Sistema TS (CSV)" icon="download-outline" variant="soft" onPress={exportSTS} style={{ marginTop: 14 }} />
        <View style={{ height: 14 }} />
        <Segmented options={['tutte', 'da inviare STS'] as const} value={filter} onChange={setFilter} />
        {list.length === 0 ? (
          <Empty title="Nessuna ricevuta" text="Crea una ricevuta dalle sedute svolte: rivalsa ENPAP e bollo sono calcolati in automatico." action={<Button title="Nuova ricevuta" icon="add" onPress={() => nav.navigate('ReceiptForm', {})} />} />
        ) : (
          list.map((r, i) => {
            const p = db.patients.find((x) => x.id === r.patientId);
            return (
              <Card key={r.id} index={i} onPress={() => nav.navigate('ReceiptDetail', { id: r.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: r.cancelled ? 0.55 : 1 }}>
                <Avatar text={initials(p)} color={p?.color ?? colors.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={font.h3}>N. {r.number} · {fullName(p)}</Text>
                  <Text style={font.small}>{fmtDate(r.date)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[font.h3, { color: r.cancelled ? colors.muted : colors.primary }]}>{euro(r.total)}</Text>
                  {r.cancelled ? <Pill text="Annullata" color={colors.muted} /> : !r.stsSent && <Pill text="STS" color={colors.sun} />}
                </View>
              </Card>
            );
          })
        )}
      </Screen>
      <Fab onPress={() => nav.navigate('ReceiptForm', {})} />
    </View>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{value}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>{label}</Text>
    </View>
  );
}
