import { colors } from '../theme';
import { AppointmentStatus, AppointmentType } from '../types';

export const STATUS_COLOR: Record<AppointmentStatus, string> = {
  programmato: colors.primary,
  svolto: colors.sage,
  annullato: colors.muted,
  assente: colors.danger,
};

export const TYPES: readonly AppointmentType[] = ['individuale', 'coppia', 'famiglia', 'online', 'valutazione', 'gruppo'];
export const STATUSES: readonly AppointmentStatus[] = ['programmato', 'svolto', 'assente', 'annullato'];

export const TYPE_LABEL: Record<AppointmentType, string> = {
  individuale: 'Seduta individuale',
  coppia: 'Seduta di coppia',
  famiglia: 'Seduta familiare',
  online: 'Seduta online',
  valutazione: 'Colloquio di valutazione',
  gruppo: 'Seduta di gruppo',
};

export const MOODS = [
  { icon: 'thunderstorm', label: 'Molto difficile', color: colors.danger },
  { icon: 'rainy', label: 'Difficile', color: colors.peach },
  { icon: 'partly-sunny', label: 'Neutro', color: colors.sun },
  { icon: 'sunny', label: 'Buono', color: colors.sage },
  { icon: 'sparkles', label: 'Molto buono', color: colors.primary },
] as const;
