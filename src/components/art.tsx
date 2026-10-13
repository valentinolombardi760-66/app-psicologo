import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient as SvgGrad, Path, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme';
import { useLoop } from './anim';

/** Fiore di loto: simbolo di equilibrio e crescita. */
export function Lotus({ size = 120, color = colors.primary }: { size?: number; color?: string }) {
  const petals = [-60, -30, 0, 30, 60];
  return (
    <Svg width={size} height={size * 0.75} viewBox="0 0 120 90">
      <Defs>
        <SvgGrad id="petal" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.95" />
          <Stop offset="1" stopColor={color} stopOpacity="0.35" />
        </SvgGrad>
      </Defs>
      {petals.map((a, i) => (
        <G key={a} rotation={a} origin="60, 78">
          <Ellipse cx="60" cy="48" rx={i === 2 ? 13 : 11} ry="30" fill="url(#petal)" opacity={i === 2 ? 1 : 0.75} />
        </G>
      ))}
      <Path d="M18 80 Q60 92 102 80" stroke={color} strokeOpacity={0.5} strokeWidth={3} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/** Profilo di testa con "rami" di pensiero: illustrazione della mente. */
export function MindHead({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Defs>
        <SvgGrad id="head" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.55" />
        </SvgGrad>
      </Defs>
      <Path
        d="M78 128 L78 108 Q92 108 96 98 L98 88 Q106 86 104 80 L98 70 Q102 40 78 26 Q52 14 34 34 Q20 52 28 76 Q34 92 44 98 L44 128 Z"
        fill="url(#head)"
      />
      <G stroke={colors.primary} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.85}>
        <Path d="M50 82 Q52 62 64 56 Q74 50 80 40" />
        <Path d="M64 56 Q60 44 50 40" />
        <Path d="M70 52 Q80 56 84 66" />
        <Path d="M56 66 Q46 62 42 52" />
      </G>
      <Circle cx="80" cy="40" r="4.5" fill={colors.sage} />
      <Circle cx="50" cy="40" r="3.5" fill={colors.peach} />
      <Circle cx="84" cy="66" r="3.5" fill={colors.sun} />
      <Circle cx="42" cy="52" r="3" fill={colors.sky} />
    </Svg>
  );
}

export function PsiLogo({ size = 56, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <LinearGradient
      colors={dark ? ['#FFFFFF', '#ECE9FE'] : gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: size * 0.55, color: dark ? colors.primary : '#fff', fontWeight: '300', marginTop: -size * 0.04 }}>Ψ</Text>
    </LinearGradient>
  );
}

/** Bolle che fluttuano lentamente sullo sfondo. */
export function FloatingBlobs({ tint = colors.primary }: { tint?: string }) {
  const a = useLoop(6000);
  const b = useLoop(7500, 800);
  const c = useLoop(9000, 400);
  const blob = (v: Animated.Value, size: number, pos: object, color: string, dx: number, dy: number) => (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.blob,
        pos,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [
            { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
          ],
        },
      ]}
    />
  );
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      {blob(a, 220, { top: -60, right: -70 }, tint + '22', -20, 25)}
      {blob(b, 160, { top: 260, left: -60 }, colors.sage + '1E', 25, -20)}
      {blob(c, 120, { bottom: 80, right: -30 }, colors.peach + '22', -15, -25)}
    </View>
  );
}

const styles = StyleSheet.create({ blob: { position: 'absolute' } });
