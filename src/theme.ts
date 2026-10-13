export const colors = {
  bg: '#F5F3FB',
  card: '#FFFFFF',
  ink: '#2B2748',
  inkSoft: '#6E6A8A',
  muted: '#A7A3BF',
  line: '#E8E5F3',
  primary: '#7464F0',
  primaryDark: '#5A4BD6',
  primarySoft: '#ECE9FE',
  sage: '#4FB39C',
  sageSoft: '#E1F4EF',
  peach: '#F29A86',
  peachSoft: '#FDEBE6',
  sky: '#5AA9E6',
  skySoft: '#E3F1FC',
  sun: '#F2B84B',
  sunSoft: '#FDF3DF',
  danger: '#E2566B',
  dangerSoft: '#FCE6EA',
  white: '#FFFFFF',
};

export const gradients = {
  hero: ['#7464F0', '#9C8BF7', '#B9A8FA'] as const,
  calm: ['#F5F3FB', '#EEF6F7'] as const,
  sage: ['#4FB39C', '#7FD1BC'] as const,
  sunset: ['#F29A86', '#F7C59F'] as const,
  night: ['#2B2748', '#4A3F8C'] as const,
};

export const patientColors = ['#7464F0', '#4FB39C', '#F29A86', '#5AA9E6', '#F2B84B', '#C77DDB', '#E2566B', '#3E8E7E'];

export const radius = { sm: 10, md: 16, lg: 24, xl: 32 };
export const space = (n: number) => n * 4;

export const shadow = {
  shadowColor: '#3B2F8F',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};

export const font = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: colors.ink, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.ink },
  h3: { fontSize: 16, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 15, color: colors.ink },
  small: { fontSize: 13, color: colors.inkSoft },
  tiny: { fontSize: 11, color: colors.muted, fontWeight: '600' as const, letterSpacing: 0.6 },
};
