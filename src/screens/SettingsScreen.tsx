import React, { useState } from 'react';
import { Modal, Platform, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors, font } from '../theme';
import { FadeIn } from '../components/anim';
import { PsiLogo } from '../components/art';
import { Button, Card, Field, Header, Row, Screen, SectionTitle, Segmented, ToggleRow } from '../components/ui';
import { parseBackup, useStore } from '../storage/store';
import { decryptBackup, encryptBackup } from '../storage/crypto';
import { demoData } from '../storage/demo';
import { amountInput, parseAmount, today } from '../utils/format';
import { readTextFile, shareTextFile } from '../utils/share';
import { confirm, notify } from '../utils/confirm';
import { useNav } from '../nav';
import LockScreen from './LockScreen';
import { Profile } from '../types';

export default function SettingsScreen() {
  const { db, updateSettings, replaceDB, persist } = useStore();
  const nav = useNav();
  const s = db.settings;
  const [profile, setProfile] = useState<Profile>(s.profile);
  const [rate, setRate] = useState(amountInput(s.defaultRate));
  const [duration, setDuration] = useState(String(s.defaultDuration));
  const [changingPin, setChangingPin] = useState(false);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const setP = (k: keyof Profile) => (v: string) => setProfile((p) => ({ ...p, [k]: v }));

  const saveProfile = () => {
    updateSettings({ profile, defaultRate: parseAmount(rate) || s.defaultRate, defaultDuration: Number(duration) || s.defaultDuration });
    notify('Salvato', 'Profilo aggiornato.');
  };

  const exportBackup = async () => {
    if (pw.length < 8) return notify('Password troppo corta', 'Usa almeno 8 caratteri: il backup contiene dati sanitari.');
    setBusy(true);
    try {
      const file = await encryptBackup(JSON.stringify(db), pw);
      await shareTextFile(`backup_studio_${today()}.psico`, file, 'application/octet-stream');
    } catch (e: any) {
      notify('Errore', e?.message ?? 'Backup non riuscito');
    } finally {
      setBusy(false);
    }
  };

  const importBackup = async () => {
    if (!pw) return notify('Password', 'Inserisci la password usata per creare il backup.');
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: '*/*' });
    if (res.canceled) return;
    setBusy(true);
    try {
      const asset = res.assets[0];
      const text = await readTextFile(asset.uri, (asset as any).file);
      const next = parseBackup(await decryptBackup(text, pw));
      confirm('Ripristinare il backup?', `Contiene ${next.patients.length} pazienti e ${next.receipts.length} ricevute. I dati attuali verranno sostituiti.`, () => replaceDB(next), 'Ripristina');
    } catch (e: any) {
      notify('Errore', e?.message ?? 'Ripristino non riuscito');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Impostazioni" subtitle="Profilo, fisco, sicurezza e backup" />

      <FadeIn index={1}>
        <SectionTitle>Profilo professionale</SectionTitle>
        <Card>
          <Segmented options={['Dott.', 'Dott.ssa'] as const} value={profile.title as any} onChange={setP('title')} />
          <Field label="Nome e cognome" value={profile.fullName} onChangeText={setP('fullName')} />
          <Field label="Qualifica" value={profile.specialization} onChangeText={setP('specialization')} />
          <Row>
            <View style={{ flex: 1.4 }}><Field label="Ordine regionale" value={profile.alboRegion} onChangeText={setP('alboRegion')} /></View>
            <View style={{ flex: 1 }}><Field label="N. iscrizione" value={profile.alboNumber} onChangeText={setP('alboNumber')} /></View>
          </Row>
          <Field label="Partita IVA" value={profile.vat} onChangeText={setP('vat')} keyboardType="number-pad" />
          <Field label="Codice fiscale" value={profile.taxCode} onChangeText={(v) => setP('taxCode')(v.toUpperCase())} autoCapitalize="characters" />
          <Field label="Indirizzo studio" value={profile.address} onChangeText={setP('address')} />
          <Field label="Telefono" value={profile.phone} onChangeText={setP('phone')} keyboardType="phone-pad" />
          <Field label="Email / PEC" value={profile.email} onChangeText={setP('email')} autoCapitalize="none" />
          <Field label="IBAN (per bonifici)" value={profile.iban} onChangeText={(v) => setP('iban')(v.toUpperCase())} autoCapitalize="characters" />
          <Row>
            <View style={{ flex: 1 }}><Field label="Tariffa base (€)" value={rate} onChangeText={setRate} keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1 }}><Field label="Durata seduta (min)" value={duration} onChangeText={setDuration} keyboardType="number-pad" /></View>
          </Row>
          <Button title="Salva profilo" icon="checkmark" onPress={saveProfile} />
        </Card>
      </FadeIn>

      <FadeIn index={2}>
        <SectionTitle>Fisco</SectionTitle>
        <Card>
          <Text style={[font.tiny, { marginBottom: 8 }]}>REGIME</Text>
          <Segmented options={['forfettario', 'ordinario'] as const} value={s.regime} onChange={(regime) => updateSettings({ regime })} />
          <ToggleRow label="Rivalsa ENPAP 2%" hint="Contributo integrativo addebitato al paziente" value={s.enpap} onChange={(enpap) => updateSettings({ enpap })} />
          <ToggleRow label="Bollo a carico del paziente" hint="2 € aggiunti in ricevuta sopra 77,47 €" value={s.stampCharged} onChange={(stampCharged) => updateSettings({ stampCharged })} />
          <Text style={[font.small, { marginTop: 10 }]}>
            Le ricevute verso privati sono cartacee/PDF: la fattura elettronica per prestazioni sanitarie a persone fisiche è vietata. Verso aziende ed enti serve la fattura elettronica, da emettere con il tuo gestionale o commercialista.
          </Text>
        </Card>
      </FadeIn>

      <FadeIn index={3}>
        <SectionTitle>Sicurezza</SectionTitle>
        <Card>
          {Platform.OS !== 'web' && <ToggleRow label="Sblocco con impronta / Face ID" value={s.biometric} onChange={(biometric) => updateSettings({ biometric })} />}
          <Text style={[font.tiny, { marginVertical: 10 }]}>BLOCCO AUTOMATICO DOPO</Text>
          <Segmented options={['0', '2', '5', '15'] as const} value={String(s.autoLockMinutes) as any} onChange={(v) => updateSettings({ autoLockMinutes: Number(v) })} labels={{ '0': 'Subito', '2': '2 min', '5': '5 min', '15': '15 min' }} />
          <Button title="Cambia PIN" icon="keypad-outline" variant="soft" onPress={() => setChangingPin(true)} />
        </Card>
      </FadeIn>

      <FadeIn index={4}>
        <SectionTitle>Backup cifrato</SectionTitle>
        <Card>
          <Text style={[font.small, { marginBottom: 12 }]}>
            I dati esistono solo su questo telefono: se lo perdi senza backup, li perdi. Esporta un backup protetto da password e conservalo in un posto sicuro.
          </Text>
          <Field label="Password del backup" value={pw} onChangeText={setPw} secureTextEntry placeholder="Almeno 8 caratteri" />
          <View style={{ gap: 10 }}>
            <Button title={busy ? 'Attendere…' : 'Esporta backup'} icon="cloud-download-outline" onPress={exportBackup} disabled={busy} />
            <Button title="Ripristina da backup" icon="refresh" variant="soft" onPress={importBackup} disabled={busy} />
          </View>
        </Card>
      </FadeIn>

      <FadeIn index={5}>
        <SectionTitle>Benessere</SectionTitle>
        <Button title="Esercizio di respirazione" icon="leaf-outline" variant="soft" onPress={() => nav.navigate('Breathing')} />
        {db.patients.length === 0 && (
          <Button title="Carica dati di esempio" icon="flask-outline" variant="ghost" style={{ marginTop: 6 }} onPress={() => replaceDB(demoData(db))} />
        )}
      </FadeIn>

      <FadeIn index={6} style={{ alignItems: 'center', marginTop: 30 }}>
        <PsiLogo size={44} />
        <Text style={[font.small, { marginTop: 8 }]}>Studio · versione 1.0</Text>
        <Text style={[font.small, { color: colors.muted, textAlign: 'center' }]}>Dati cifrati sul dispositivo (XChaCha20-Poly1305)</Text>
      </FadeIn>

      <Modal visible={changingPin} animationType="fade" onRequestClose={() => setChangingPin(false)}>
        <LockScreen mode="create" onDone={() => { persist(); setChangingPin(false); notify('PIN aggiornato', 'Il nuovo PIN è attivo.'); }} />
      </Modal>
    </Screen>
  );
}
