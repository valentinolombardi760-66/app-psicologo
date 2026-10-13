import React from 'react';
import { Text, View } from 'react-native';
import { colors, font } from '../theme';
import { FadeIn } from '../components/anim';
import { Lotus } from '../components/art';
import { Button, Card, Empty, Header, Pill, Screen, ToggleRow } from '../components/ui';
import { useStore } from '../storage/store';
import { ScreenProps } from '../nav';
import { euro, fmtDate, fullName } from '../utils/format';
import { PAYMENT_LABEL, receiptHTML } from '../utils/receipt';
import { sharePDF } from '../utils/share';
import { confirm, notify } from '../utils/confirm';

export default function ReceiptDetailScreen({ navigation, route }: ScreenProps<'ReceiptDetail'>) {
  const { db, saveReceipt } = useStore();
  const r = db.receipts.find((x) => x.id === route.params.id);
  if (!r) return <Screen><Header title="Ricevuta" onBack={() => navigation.goBack()} /><Empty title="Ricevuta non trovata" text="" /></Screen>;
  const p = db.patients.find((x) => x.id === r.patientId);

  const share = async () => {
    try {
      await sharePDF(receiptHTML(r, p, db.settings), `Ricevuta_${r.number}_${r.year}_${p?.lastName ?? ''}`);
    } catch (e: any) {
      notify('Errore', e?.message ?? 'Impossibile creare il PDF');
    }
  };

  return (
    <Screen>
      <Header title={`Ricevuta ${r.number}/${r.year}`} subtitle={fmtDate(r.date)} onBack={() => navigation.goBack()} />
      <FadeIn index={1}>
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Lotus size={90} color={r.cancelled ? colors.muted : colors.sage} />
          <Text style={[font.h1, { marginTop: 8, color: r.cancelled ? colors.muted : colors.ink, textDecorationLine: r.cancelled ? 'line-through' : 'none' }]}>{euro(r.total)}</Text>
          <Text style={font.small}>{fullName(p)}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
            <Pill text={PAYMENT_LABEL[r.paymentMethod]} />
            {r.cancelled ? <Pill text="Annullata" color={colors.danger} /> : <Pill text={r.stsSent ? 'Inviata STS' : 'Da inviare STS'} color={r.stsSent ? colors.sage : colors.sun} />}
          </View>
        </Card>
      </FadeIn>
      <FadeIn index={2}>
        <Card>
          {r.items.map((i, k) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={[font.body, { flex: 1, paddingRight: 10 }]}>{i.description}</Text>
              <Text style={font.body}>{euro(i.amount)}</Text>
            </View>
          ))}
          {r.enpap > 0 && <Row label="Rivalsa ENPAP" value={euro(r.enpap)} />}
          {r.stamp > 0 && <Row label="Marca da bollo" value={euro(r.stamp)} />}
          <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 8 }} />
          <Row label="Totale" value={euro(r.total)} bold />
        </Card>
      </FadeIn>
      {!r.cancelled && (
        <FadeIn index={3}>
          <Card>
            <ToggleRow label="Inviata al Sistema Tessera Sanitaria" hint={p?.stsOpposition ? 'Il paziente si è opposto: va comunicata con il flag di opposizione' : 'Spese 2026: invio entro il 1° febbraio 2027'} value={r.stsSent} onChange={(v) => saveReceipt({ ...r, stsSent: v })} />
          </Card>
          <View style={{ gap: 10, marginTop: 8 }}>
            <Button title="Condividi PDF" icon="share-outline" onPress={share} />
            <Button
              title="Annulla ricevuta"
              icon="close-circle-outline"
              variant="danger"
              onPress={() => confirm('Annullare la ricevuta?', 'La numerazione resta (non si riusa il numero). Le sedute torneranno “da fatturare”. Se già consegnata, emetti una nota di credito con il commercialista.', () => saveReceipt({ ...r, cancelled: true }), 'Annulla ricevuta')}
            />
          </View>
        </FadeIn>
      )}
    </Screen>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={[font.body, bold && { fontWeight: '800' }]}>{label}</Text>
      <Text style={[font.body, bold && { fontWeight: '800', color: colors.primary }]}>{value}</Text>
    </View>
  );
}
