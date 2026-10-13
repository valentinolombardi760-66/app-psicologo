const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
export const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export const pad = (n: number) => String(n).padStart(2, '0');

export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => toISODate(new Date());

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const fmtDate = (s?: string) => {
  if (!s) return '—';
  const d = s.length > 10 ? new Date(s) : parseISODate(s);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const fmtLongDate = (d: Date) => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const fmtMonth = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const euro = (n: number) =>
  '€ ' + (Math.round(n * 100) / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const parseAmount = (s: string) => {
  const n = parseFloat(String(s).replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

export const amountInput = (n?: number) => (n === undefined || n === null ? '' : String(n).replace('.', ','));

export const fullName = (p?: { firstName: string; lastName: string }) => (p ? `${p.firstName} ${p.lastName}`.trim() : 'Paziente eliminato');
export const initials = (p?: { firstName: string; lastName: string }) =>
  p ? `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase() : '?';

export function age(birth?: string) {
  if (!birth) return undefined;
  const b = parseISODate(birth);
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

export const startOfWeek = (d: Date) => {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (c.getDay() + 6) % 7; // lunedì = 0
  c.setDate(c.getDate() - diff);
  return c;
};

export const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

/** Controllo formale del codice fiscale (struttura + carattere di controllo). */
export function isValidTaxCode(cf: string) {
  const s = cf.toUpperCase().trim();
  if (!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(s)) return false;
  const odd: Record<string, number> = {
    '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
    A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18, N: 20,
    O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
  };
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const c = s[i];
    if (i % 2 === 0) sum += odd[c];
    else sum += /[0-9]/.test(c) ? Number(c) : c.charCodeAt(0) - 65;
  }
  return String.fromCharCode(65 + (sum % 26)) === s[15];
}

export const QUOTES = [
  'Ogni seduta è uno spazio sicuro: anche per te.',
  'Prenditi cura di chi si prende cura.',
  'Ascoltare è il primo gesto terapeutico.',
  'Un passo alla volta, anche oggi.',
  'Il cambiamento inizia da una domanda.',
  'Respira. Il tempo per sé non è tempo perso.',
  'Le emozioni sono messaggi, non nemici.',
];
export const quoteOfDay = () => QUOTES[new Date().getDate() % QUOTES.length];

/** Numero per wa.me: se manca il prefisso internazionale si assume l'Italia (+39). */
export function waNumber(phone: string) {
  const t = phone.trim();
  if (t.startsWith('+')) return t.replace(/\D/g, '');
  if (t.startsWith('00')) return t.replace(/\D/g, '').slice(2);
  return '39' + t.replace(/\D/g, '');
}
