import React, { useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, gradients } from '../theme';
import { FadeIn } from '../components/anim';
import { Lotus, MindHead, PsiLogo } from '../components/art';
import { Button, Field, Segmented } from '../components/ui';
import { useStore } from '../storage/store';
import { Regime } from '../types';

const SLIDES = [
  { art: 'mind', title: 'Il tuo studio, in tasca', text: 'Pazienti, agenda, diario clinico e ricevute in un unico posto, pensato per psicologi e psicoterapeuti.' },
  { art: 'lock', title: 'Privacy prima di tutto', text: 'I dati sanitari restano cifrati sul telefono, protetti da PIN e impronta. Nessun server, nessun cloud.' },
  { art: 'lotus', title: 'Ricevute in regola', text: 'Esenzione IVA, rivalsa ENPAP 2%, marca da bollo e dati per il Sistema Tessera Sanitaria calcolati per te.' },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { db, updateSettings } = useStore();
  const [step, setStep] = useState(0);
  const [p, setP] = useState(db.settings.profile);
  const [regime, setRegime] = useState<Regime>(db.settings.regime);
  const fade = useRef(new Animated.Value(1)).current;

  const go = (n: number) => {
    Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: Platform.OS !== 'web' }).start(() => {
      setStep(n);
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: Platform.OS !== 'web' }).start();
    });
  };

  if (step < SLIDES.length) {
    const s = SLIDES[step];
    return (
      <LinearGradient colors={gradients.hero} style={{ flex: 1 }}>
        <SafeAreaView style={styles.wrap}>
          <Animated.View style={{ alignItems: 'center', opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            <View style={styles.artCircle}>
              {s.art === 'mind' ? <MindHead size={170} /> : s.art === 'lock' ? <PsiLogo size={120} dark /> : <Lotus size={170} color="#fff" />}
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.text}>{s.text}</Text>
          </Animated.View>
          <View style={{ width: '100%' }}>
            <View style={styles.dots}>
              {SLIDES.map((_, i) => (
                <View key={i} style={[styles.dot, i === step && { width: 22, backgroundColor: '#fff' }]} />
              ))}
            </View>
            <Button title={step === SLIDES.length - 1 ? 'Iniziamo' : 'Avanti'} onPress={() => go(step + 1)} variant="soft" />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const set = (k: keyof typeof p) => (v: string) => setP({ ...p, [k]: v });
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 22 }} keyboardShouldPersistTaps="handled">
          <FadeIn>
            <Text style={font.h1}>Il tuo profilo</Text>
            <Text style={[font.small, { marginTop: 4, marginBottom: 20 }]}>Questi dati compaiono sulle ricevute. Puoi modificarli in seguito.</Text>
          </FadeIn>
          <FadeIn index={1}>
            <Segmented options={['Dott.', 'Dott.ssa'] as const} value={p.title as any} onChange={set('title')} />
            <Field label="Nome e cognome" value={p.fullName} onChangeText={set('fullName')} placeholder="Maria Rossi" />
            <Field label="Qualifica" value={p.specialization} onChangeText={set('specialization')} placeholder="Psicologa Psicoterapeuta" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1.4 }}><Field label="Ordine regionale" value={p.alboRegion} onChangeText={set('alboRegion')} placeholder="Lazio" /></View>
              <View style={{ flex: 1 }}><Field label="N. iscrizione" value={p.alboNumber} onChangeText={set('alboNumber')} placeholder="12345" /></View>
            </View>
            <Field label="Partita IVA" value={p.vat} onChangeText={set('vat')} keyboardType="number-pad" />
            <Field label="Codice fiscale" value={p.taxCode} onChangeText={(v) => set('taxCode')(v.toUpperCase())} autoCapitalize="characters" />
            <Field label="Indirizzo studio" value={p.address} onChangeText={set('address')} placeholder="Via Roma 1, 00100 Roma" />
            <Text style={[font.tiny, { marginBottom: 8 }]}>REGIME FISCALE</Text>
            <Segmented options={['forfettario', 'ordinario'] as const} value={regime} onChange={setRegime} />
            <Button
              title="Continua e crea il PIN"
              icon="lock-closed"
              disabled={!p.fullName.trim()}
              onPress={() => {
                updateSettings({ profile: p, regime });
                onDone();
              }}
            />
          </FadeIn>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const W = Dimensions.get('window').width;
const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: 28 },
  artCircle: { width: Math.min(W * 0.7, 280), height: Math.min(W * 0.7, 280), borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginTop: 40, marginBottom: 34 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  text: { color: 'rgba(255,255,255,0.88)', fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 23, maxWidth: 340 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' },
});
