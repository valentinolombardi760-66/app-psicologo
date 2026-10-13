import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { gradients } from '../theme';
import { IconButton, Segmented } from '../components/ui';
import { Lotus } from '../components/art';
import { ScreenProps } from '../nav';

const PATTERNS = {
  quadrata: [['Inspira', 4], ['Trattieni', 4], ['Espira', 4], ['Trattieni', 4]],
  '4-7-8': [['Inspira', 4], ['Trattieni', 7], ['Espira', 8]],
  coerente: [['Inspira', 5], ['Espira', 5]],
} as const;
type Pattern = keyof typeof PATTERNS;

/** Respirazione guidata: utile per sé tra una seduta e l'altra, o da mostrare al paziente. */
export default function BreathingScreen({ navigation }: ScreenProps<'Breathing'>) {
  const [pattern, setPattern] = useState<Pattern>('quadrata');
  const [phase, setPhase] = useState(0);
  const [left, setLeft] = useState<number>(PATTERNS.quadrata[0][1]);
  const [cycles, setCycles] = useState(0);
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    let stopped = false;
    let i = 0;
    let timer: ReturnType<typeof setInterval>;
    const steps = PATTERNS[pattern];
    const run = () => {
      if (stopped) return;
      const [label, secs] = steps[i % steps.length];
      setPhase(i % steps.length);
      setLeft(secs);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const target = label === 'Inspira' ? 1 : label === 'Espira' ? 0.6 : undefined;
      if (target !== undefined) Animated.timing(scale, { toValue: target, duration: secs * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }).start();
      let n = secs;
      clearInterval(timer);
      timer = setInterval(() => {
        n -= 1;
        if (n > 0) setLeft(n);
        else {
          clearInterval(timer);
          i += 1;
          if (i % steps.length === 0) setCycles((c) => c + 1);
          run();
        }
      }, 1000);
    };
    scale.setValue(0.6);
    setCycles(0);
    run();
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [pattern]);

  const label = PATTERNS[pattern][phase]?.[0] ?? '';

  return (
    <LinearGradient colors={gradients.night} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="close" onPress={() => navigation.goBack()} label="Chiudi" />
          <Text style={styles.title}>Respira</Text>
          <View style={{ width: 42 }} />
        </View>
        <View style={{ marginTop: 18 }}>
          <Segmented options={Object.keys(PATTERNS) as Pattern[]} value={pattern} onChange={setPattern} />
        </View>
        <View style={styles.center}>
          {[1.5, 1.25].map((k, i) => (
            <Animated.View key={i} style={[styles.ring, { opacity: 0.12 + i * 0.08, transform: [{ scale: Animated.multiply(scale, k) }] }]} />
          ))}
          <Animated.View style={[styles.core, { transform: [{ scale }] }]}>
            <Lotus size={110} color="#FFFFFF" />
          </Animated.View>
          <View style={styles.labelBox}>
            <Text style={styles.phase}>{label}</Text>
            <Text style={styles.count}>{left}</Text>
          </View>
        </View>
        <Text style={styles.foot}>Cicli completati: {cycles}</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  title: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 20, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: '#B9A8FA' },
  core: { width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(156,139,247,0.55)', alignItems: 'center', justifyContent: 'center' },
  labelBox: { position: 'absolute', bottom: '12%', alignItems: 'center' },
  phase: { color: '#fff', fontSize: 26, fontWeight: '700' },
  count: { color: 'rgba(255,255,255,0.7)', fontSize: 18, marginTop: 4 },
  foot: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 10 },
});
