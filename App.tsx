import React, { useEffect, useRef, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StoreProvider, useStore } from './src/storage/store';
import { hasPin, lock } from './src/storage/crypto';
import { requestPersistence } from './src/storage/kv';
import Navigation from './src/navigation';
import LockScreen from './src/screens/LockScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { PsiLogo } from './src/components/art';
import { gradients } from './src/theme';

function Gate() {
  const { db, ready, updateSettings, load } = useStore();
  const [pinExists, setPinExists] = useState<boolean | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [profileDone, setProfileDone] = useState(false);
  const leftAt = useRef<number | null>(null);

  useEffect(() => {
    hasPin().then(setPinExists).catch(() => setPinExists(false));
    requestPersistence();
  }, []);

  // Blocco automatico quando l'app resta in background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') leftAt.current = Date.now();
      if (s === 'active' && leftAt.current) {
        if (Date.now() - leftAt.current > db.settings.autoLockMinutes * 60_000) {
          lock();
          setUnlocked(false);
        }
        leftAt.current = null;
      }
    });
    return () => sub.remove();
  }, [db.settings.autoLockMinutes]);

  if (!ready || pinExists === null) {
    return (
      <LinearGradient colors={gradients.night} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <PsiLogo size={80} dark />
      </LinearGradient>
    );
  }

  if (!pinExists) {
    if (!profileDone) return <OnboardingScreen onDone={() => setProfileDone(true)} />;
    return (
      <LockScreen
        mode="create"
        onDone={() => {
          updateSettings({ onboarded: true });
          setPinExists(true);
          setUnlocked(true);
        }}
      />
    );
  }

  if (!unlocked)
    return (
      <LockScreen
        mode="unlock"
        biometric={db.settings.biometric}
        onDone={async () => {
          if (Platform.OS === 'web') await load();
          setUnlocked(true);
        }}
      />
    );

  return <Navigation />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <View style={{ flex: 1 }}>
          <StatusBar style="dark" />
          <Gate />
        </View>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
