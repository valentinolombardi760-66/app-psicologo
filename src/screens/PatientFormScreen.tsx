import React, { useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { colors, font, patientColors } from '../theme';
import { FadeIn, PressScale } from '../components/anim';
import { Button, Card, DateField, Field, Header, Row, Screen, SectionTitle, ToggleRow } from '../components/ui';
import { newId, useStore } from '../storage/store';
import { ScreenProps } from '../nav';
import { amountInput, isValidTaxCode, parseAmount, today } from '../utils/format';
import { Patient } from '../types';

const blank = (): Patient => ({
  id: newId(),
  firstName: '',
  lastName: '',
  taxCode: '',
  phone: '',
  email: '',
  address: '',
  referral: '',
  reason: '',
  anamnesis: '',
  color: patientColors[Math.floor(Math.random() * patientColors.length)],
  isMinor: false,
  guardianName: '',
  guardianTaxCode: '',
  consentInformed: false,
  consentPrivacy: false,
  stsOpposition: false,
  archived: false,
  createdAt: new Date().toISOString(),
});

export default function PatientFormScreen({ navigation, route }: ScreenProps<'PatientForm'>) {
  const { db, savePatient } = useStore();
  const existing = db.patients.find((p) => p.id === route.params?.id);
  const [p, setP] = useState<Patient>(existing ?? blank());
  const [rate, setRate] = useState(amountInput(existing?.rate));
  const set = <K extends keyof Patient>(k: K) => (v: Patient[K]) => setP((x) => ({ ...x, [k]: v }));

  const cfWarning = p.taxCode.length > 0 && !isValidTaxCode(p.taxCode);

  const save = () => {
    if (!p.firstName.trim() || !p.lastName.trim()) {
      const msg = 'Nome e cognome sono obbligatori.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Dati mancanti', msg);
      return;
    }
    savePatient({ ...p, taxCode: p.taxCode.toUpperCase().trim(), rate: rate ? parseAmount(rate) : undefined });
    navigation.goBack();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title={existing ? 'Modifica paziente' : 'Nuovo paziente'} onBack={() => navigation.goBack()} />
      <FadeIn index={1}>
        <SectionTitle>Anagrafica</SectionTitle>
        <Card>
          <Row>
            <View style={{ flex: 1 }}><Field label="Nome" value={p.firstName} onChangeText={set('firstName')} /></View>
            <View style={{ flex: 1 }}><Field label="Cognome" value={p.lastName} onChangeText={set('lastName')} /></View>
          </Row>
          <Field label="Codice fiscale" value={p.taxCode} onChangeText={(v) => set('taxCode')(v.toUpperCase())} autoCapitalize="characters" maxLength={16} />
          {cfWarning && <Text style={{ color: colors.danger, fontSize: 12, marginTop: -8, marginBottom: 10 }}>Il codice fiscale non sembra valido: serve per le ricevute e il Sistema TS.</Text>}
          <DateField label="Data di nascita" value={p.birthDate} onChange={set('birthDate')} />
          <Text style={[font.tiny, { marginBottom: 8 }]}>COLORE</Text>
          <Row gap={10} style={{ marginBottom: 6, flexWrap: 'wrap' }}>
            {patientColors.map((c) => (
              <PressScale key={c} onPress={() => set('color')(c)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c, borderWidth: p.color === c ? 3 : 0, borderColor: colors.ink }}>
                <View />
              </PressScale>
            ))}
          </Row>
        </Card>
      </FadeIn>

      <FadeIn index={2}>
        <SectionTitle>Contatti</SectionTitle>
        <Card>
          <Field label="Telefono" value={p.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="+39 ..." />
          <Field label="Email" value={p.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Indirizzo" value={p.address} onChangeText={set('address')} />
        </Card>
      </FadeIn>

      <FadeIn index={3}>
        <SectionTitle>Minore</SectionTitle>
        <Card>
          <ToggleRow label="Paziente minorenne" hint="La ricevuta viene intestata al genitore o tutore" value={p.isMinor} onChange={set('isMinor')} />
          {p.isMinor && (
            <View style={{ marginTop: 12 }}>
              <Field label="Genitore / tutore" value={p.guardianName} onChangeText={set('guardianName')} />
              <Field label="CF genitore / tutore" value={p.guardianTaxCode} onChangeText={(v) => set('guardianTaxCode')(v.toUpperCase())} autoCapitalize="characters" maxLength={16} />
            </View>
          )}
        </Card>
      </FadeIn>

      <FadeIn index={4}>
        <SectionTitle>Presa in carico</SectionTitle>
        <Card>
          <Field label="Motivo della richiesta" value={p.reason} onChangeText={set('reason')} multiline />
          <Field label="Anamnesi / note iniziali" value={p.anamnesis} onChangeText={set('anamnesis')} multiline />
          <Field label="Inviante" value={p.referral} onChangeText={set('referral')} placeholder="Medico di base, passaparola..." />
          <Field label="Tariffa personalizzata (€)" value={rate} onChangeText={setRate} keyboardType="decimal-pad" placeholder={`Predefinita: ${db.settings.defaultRate}`} />
        </Card>
      </FadeIn>

      <FadeIn index={5}>
        <SectionTitle>Consensi e privacy</SectionTitle>
        <Card>
          <ToggleRow label="Consenso informato firmato" hint="Art. 24 Codice Deontologico" value={p.consentInformed} onChange={(v) => setP((x) => ({ ...x, consentInformed: v, consentDate: v ? x.consentDate ?? today() : x.consentDate }))} />
          <ToggleRow label="Informativa privacy firmata" hint="GDPR, dati relativi alla salute" value={p.consentPrivacy} onChange={(v) => setP((x) => ({ ...x, consentPrivacy: v, consentDate: v ? x.consentDate ?? today() : x.consentDate }))} />
          <ToggleRow label="Opposizione al Sistema TS" hint="Il paziente non vuole l'invio delle spese al 730 precompilato" value={p.stsOpposition} onChange={set('stsOpposition')} />
          {(p.consentInformed || p.consentPrivacy) && (
            <View style={{ marginTop: 12 }}>
              <DateField label="Data firma consensi" value={p.consentDate} onChange={set('consentDate')} />
            </View>
          )}
          {existing && <ToggleRow label="Archiviato" hint="Percorso concluso: resta nello storico" value={p.archived} onChange={set('archived')} />}
        </Card>
      </FadeIn>

      <Button title="Salva paziente" icon="checkmark" onPress={save} style={{ marginTop: 20 }} />
    </Screen>
  );
}
