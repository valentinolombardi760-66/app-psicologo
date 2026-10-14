import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { gradients } from '../theme';
import { PressScale, useLoop, FadeIn } from '../components/anim';
import { PsiLogo } from '../components/art';
import { checkPin, setPin } from '../storage/crypto';

type Props = { mode: 'unlock' | 'create'; biometric?: boolean; onDone: () => void | Promise<void> };

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'];

export default function LockScreen({ mode, biometric, onDone }: Props) {
  const [pin, setPinValue] = useState('');
  const [first, setFirst] = useState<string | null>(null);
  const [msg, setMsg] = useState(mode === 'create' ? 'Scegli un PIN di 6 cifre' : 'Inserisci il PIN');
  const shake = useRef(new Animated.Value(0)).current;
  const breathe = useLoop(4000);

  const tryBiometric = async () => {
    if (Platform.OS === 'web' || mode !== 'unlock' || !biometric) return;
    const ok = (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
    if (!ok) return;
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Sblocca PsicoLab', cancelLabel: 'Usa PIN' });
    if (res.success) onDone();
  };

  useEffect(() => {
    tryBiometric();
  }, []);

  const fail = (text: string) => {
    setMsg(text);
    setPinValue('');
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    Animated.sequence(
      [12, -12, 8, -8, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 60, useNativeDriver: Platform.OS !== 'web' })),
    ).start();
  };

  const complete = async (value: string) => {
    if (mode === 'unlock') {
      setMsg('Verifica in corso…');
      if (await checkPin(value)) await onDone();
      else fail('PIN errato, riprova');
      return;
    }
    if (!first) {
      setFirst(value);
      setPinValue('');
      setMsg('Conferma il PIN');
    } else if (first === value) {
      setMsg('Protezione dei dati in corso…');
      await setPin(value);
      await onDone();
    } else {
      setFirst(null);
      fail('I PIN non coincidono. Ricomincia');
    }
  };

  const press = (k: string) => {
    if (k === 'bio') return tryBiometric();
    if (k === 'del') return setPinValue((p) => p.slice(0, -1));
    if (pin.length >= 6) return;
    const next = pin + k;
    setPinValue(next);
    if (next.length === 6) setTimeout(() => complete(next), 120);
  };

  return (
    <LinearGradient colors={gradients.night} style={{ flex: 1 }}>
      <SafeAreaView style={styles.wrap}>
        <FadeIn style={{ alignItems: 'center' }}>
          <View style={{ alignItems: 'center', justifyContent: 'center', height: 150 }}>
            <Animated.View
              style={[styles.halo, { opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] }), transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.25] }) }] }]}
            />
            <PsiLogo size={78} dark />
          </View>
          <Text style={styles.title}>PsicoLab</Text>
          <Text style={styles.sub}>{msg}</Text>
          {mode === 'create' && Platform.OS === 'web' && (
            <Text style={styles.warn}>Il PIN è la chiave dei tuoi dati: se lo dimentichi potrai recuperarli solo da un backup.</Text>
          )}
        </FadeIn>

        <Animated.View style={[styles.dots, { transform: [{ translateX: shake }] }]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[styles.dot, i < pin.length && styles.dotOn]} />
          ))}
        </Animated.View>

        <View style={styles.pad}>
          {KEYS.map((k) => {
            if (k === 'bio' && (mode !== 'unlock' || !biometric || Platform.OS === 'web')) return <View key={k} style={styles.key} />;
            return (
              <PressScale key={k} onPress={() => press(k)} style={styles.key}>
                {k === 'del' ? (
                  <Ionicons name="backspace-outline" size={26} color="#fff" />
                ) : k === 'bio' ? (
                  <Ionicons name="finger-print" size={30} color="#fff" />
                ) : (
                  <Text style={styles.keyText}>{k}</Text>
                )}
              </PressScale>
            );
          })}
        </View>
        <Text style={styles.foot}>
          <Ionicons name="lock-closed" size={11} color="rgba(255,255,255,0.5)" /> Dati cifrati e conservati solo su questo dispositivo
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 30 },
  halo: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: '#9C8BF7' },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 15, marginTop: 6 },
  dots: { flexDirection: 'row', gap: 16 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  dotOn: { backgroundColor: '#fff', borderColor: '#fff' },
  pad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, justifyContent: 'space-between', rowGap: 16 },
  key: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  keyText: { color: '#fff', fontSize: 28, fontWeight: '500' },
  warn: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 10, textAlign: 'center', maxWidth: 300 },
  foot: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
});
