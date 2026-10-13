import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, PressableProps, StyleProp, ViewStyle, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const native = Platform.OS !== 'web';

/** Entrata morbida: dissolvenza + leggero scorrimento, con ritardo a cascata. */
export function FadeIn({ children, delay = 0, index = 0, style, from = 14 }: { children: React.ReactNode; delay?: number; index?: number; style?: StyleProp<ViewStyle>; from?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 420,
      delay: delay + Math.min(index, 10) * 55,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: native,
    }).start();
  }, []);
  return (
    <Animated.View
      style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] }]}
    >
      {children}
    </Animated.View>
  );
}

/** Pulsante che si "comprime" al tocco, con feedback aptico. */
export function PressScale({ children, style, onPress, haptic = true, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; haptic?: boolean; children: React.ReactNode }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (val: number) => Animated.spring(s, { toValue: val, useNativeDriver: native, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable
      {...rest}
      onPressIn={() => to(0.96)}
      onPressOut={() => to(1)}
      onPress={(e) => {
        if (haptic && native) Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Valore animato che oscilla all'infinito (per sfondi e respirazione). */
export function useLoop(duration: number, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return v;
}

/** Numero che "sale" fino al valore finale. */
export function CountUp({ value, format, style }: { value: number; format: (n: number) => string; style?: any }) {
  const v = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = React.useState(0);
  useEffect(() => {
    const id = v.addListener(({ value: x }) => setShown(x));
    Animated.timing(v, { toValue: value, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => v.removeListener(id);
  }, [value]);
  return <Animated.Text style={style}>{format(shown)}</Animated.Text>;
}
