import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TextInputProps, View, ViewStyle, StyleProp, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, font, radius, shadow } from '../theme';
import { FadeIn, PressScale } from './anim';
import { FloatingBlobs, Lotus } from './art';
import { fmtDate, parseISODate, pad, toISODate } from '../utils/format';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Screen({ children, scroll = true, blobs = true, padded = true, edges }: { children: React.ReactNode; scroll?: boolean; blobs?: boolean; padded?: boolean; edges?: ('top' | 'bottom')[] }) {
  const content = padded ? { padding: 20, paddingBottom: 120 } : undefined;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {blobs && <FloatingBlobs />}
      <SafeAreaView style={{ flex: 1 }} edges={edges ?? ['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {scroll ? (
            <ScrollView contentContainerStyle={content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          ) : (
            <View style={[{ flex: 1 }, content]}>{children}</View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export function Header({ title, subtitle, right, onBack }: { title: string; subtitle?: string; right?: React.ReactNode; onBack?: () => void }) {
  return (
    <FadeIn style={styles.header}>
      {onBack && (
        <PressScale onPress={onBack} style={styles.iconBtn} accessibilityLabel="Indietro">
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </PressScale>
      )}
      <View style={{ flex: 1 }}>
        <Text style={font.h1} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[font.small, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </FadeIn>
  );
}

export function IconButton({ icon, onPress, color = colors.ink, bg = colors.card, label }: { icon: IconName; onPress: () => void; color?: string; bg?: string; label?: string }) {
  return (
    <PressScale onPress={onPress} style={[styles.iconBtn, { backgroundColor: bg }]} accessibilityLabel={label}>
      <Ionicons name={icon} size={20} color={color} />
    </PressScale>
  );
}

export function Card({ children, style, onPress, index }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; index?: number }) {
  const body = <View style={[styles.card, style]}>{children}</View>;
  const inner = onPress ? <PressScale onPress={onPress}>{body}</PressScale> : body;
  return index !== undefined ? <FadeIn index={index}>{inner}</FadeIn> : inner;
}

export function Button({ title, onPress, icon, variant = 'primary', style, disabled }: { title: string; onPress: () => void; icon?: IconName; variant?: 'primary' | 'soft' | 'danger' | 'ghost' | 'sage'; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  const bg = { primary: colors.primary, soft: colors.primarySoft, danger: colors.dangerSoft, ghost: 'transparent', sage: colors.sage }[variant];
  const fg = { primary: '#fff', soft: colors.primary, danger: colors.danger, ghost: colors.inkSoft, sage: '#fff' }[variant];
  return (
    <PressScale onPress={disabled ? undefined : onPress} style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }, variant === 'primary' && shadow, style]}>
      {icon && <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 8 }} />}
      <Text style={{ color: fg, fontWeight: '700', fontSize: 15 }}>{title}</Text>
    </PressScale>
  );
}

export function Field({ label, style, multiline, ...props }: TextInputProps & { label: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        {...props}
        multiline={multiline}
        onFocus={(e) => { setFocus(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocus(false); props.onBlur?.(e); }}
        style={[styles.input, multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 }, focus && { borderColor: colors.primary, backgroundColor: '#fff' }, style]}
      />
    </View>
  );
}

export function Row({ children, style, gap = 12 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', gap, alignItems: 'center' }, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
      <Text style={[font.tiny, { flex: 1 }]}>{children.toUpperCase()}</Text>
      {right}
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange, labels }: { options: readonly T[]; value: T; onChange: (v: T) => void; labels?: Partial<Record<T, string>> }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
      {options.map((o) => {
        const on = o === value;
        return (
          <PressScale key={o} onPress={() => onChange(o)} style={[styles.chip, on && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            <Text style={{ color: on ? '#fff' : colors.inkSoft, fontWeight: '600', fontSize: 13 }}>{labels?.[o] ?? cap(o)}</Text>
          </PressScale>
        );
      })}
    </View>
  );
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Pill({ text, color = colors.primary, bg }: { text: string; color?: string; bg?: string }) {
  return (
    <View style={{ backgroundColor: bg ?? color + '1F', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, alignSelf: 'flex-start' }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

export function Avatar({ text, color, size = 44 }: { text: string; color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '26', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontWeight: '800', fontSize: size * 0.36 }}>{text}</Text>
    </View>
  );
}

export function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={font.body}>{label}</Text>
        {hint ? <Text style={[font.small, { marginTop: 2 }]}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.line }} thumbColor="#fff" />
    </View>
  );
}

export function Empty({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <FadeIn style={{ alignItems: 'center', paddingVertical: 40 }}>
      <Lotus size={130} />
      <Text style={[font.h3, { marginTop: 14 }]}>{title}</Text>
      <Text style={[font.small, { textAlign: 'center', marginTop: 6, marginBottom: 18, paddingHorizontal: 20 }]}>{text}</Text>
      {action}
    </FadeIn>
  );
}

/** Selettore data/ora: picker nativo su telefono, campo di testo sul web. */
export function DateField({ label, value, onChange, mode = 'date' }: { label: string; value?: string; onChange: (v: string) => void; mode?: 'date' | 'time' }) {
  const [open, setOpen] = useState(false);
  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: 14, flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        {React.createElement('input', {
          type: mode,
          value: value ?? '',
          onChange: (e: any) => onChange(e.target.value),
          style: { ...StyleSheet.flatten(styles.input), fontFamily: 'system-ui, -apple-system, Roboto, sans-serif', fontSize: 15, color: colors.ink, borderStyle: 'solid', width: '100%', boxSizing: 'border-box' },
        })}
      </View>
    );
  }
  const date = mode === 'date' ? (value ? parseISODate(value) : new Date()) : (() => { const d = new Date(); const [h, m] = (value || '09:00').split(':').map(Number); d.setHours(h, m, 0, 0); return d; })();
  return (
    <View style={{ marginBottom: 14, flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <PressScale onPress={() => setOpen(true)} style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}>
        <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={font.body}>{value ? (mode === 'date' ? fmtDate(value) : value) : 'Seleziona'}</Text>
      </PressScale>
      {open && (
        <DateTimePicker
          value={date}
          mode={mode}
          is24Hour
          locale="it-IT"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(e, d) => {
            setOpen(false);
            if (d && e.type !== 'dismissed') onChange(mode === 'date' ? toISODate(d) : `${pad(d.getHours())}:${pad(d.getMinutes())}`);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 12, ...shadow },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 20, borderRadius: radius.md },
  label: { ...font.tiny, marginBottom: 6, marginLeft: 2 },
  input: { backgroundColor: '#FBFAFE', borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 11, fontSize: 15, color: colors.ink },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card },
  toggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
});

/** Pulsante flottante "+" con leggera pulsazione all'apertura. */
export function Fab({ onPress, icon = 'add' }: { onPress: () => void; icon?: IconName }) {
  return (
    <FadeIn delay={300} style={{ position: 'absolute', right: 22, bottom: Platform.OS === 'ios' ? 110 : 100 }} from={30}>
      <PressScale onPress={onPress} style={[{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, shadow, { shadowOpacity: 0.3 }]}>
        <Ionicons name={icon} size={30} color="#fff" />
      </PressScale>
    </FadeIn>
  );
}

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginBottom: 12 }]}>
      <Ionicons name="search" size={18} color={colors.muted} />
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} style={{ flex: 1, marginLeft: 8, fontSize: 15, color: colors.ink, padding: 0 }} />
      {value ? <Ionicons name="close-circle" size={18} color={colors.muted} onPress={() => onChange('')} /> : null}
    </View>
  );
}
