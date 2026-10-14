export type ID = string;

export interface Patient {
  id: ID;
  firstName: string;
  lastName: string;
  taxCode: string;
  birthDate?: string; // YYYY-MM-DD
  phone: string;
  email: string;
  address: string;
  referral: string; // inviante
  reason: string; // motivo della richiesta
  anamnesis: string;
  rate?: number;
  color: string;
  isMinor: boolean;
  guardianName: string;
  guardianTaxCode: string;
  consentInformed: boolean;
  consentPrivacy: boolean;
  consentDate?: string;
  stsOpposition: boolean;
  archived: boolean;
  createdAt: string;
}

export type AppointmentType = 'individuale' | 'coppia' | 'famiglia' | 'online' | 'valutazione' | 'gruppo';
export type AppointmentStatus = 'programmato' | 'svolto' | 'annullato' | 'assente';

export interface Appointment {
  id: ID;
  patientId: ID;
  start: string; // ISO
  duration: number; // minuti
  type: AppointmentType;
  status: AppointmentStatus;
  fee: number;
  paid: boolean;
  receiptId?: ID;
  notes: string;
}

export interface SessionNote {
  id: ID;
  patientId: ID;
  appointmentId?: ID;
  date: string; // YYYY-MM-DD
  mood: number; // 1-5
  content: string;
  goals: string;
  homework: string;
  createdAt: string;
}

export type PaymentMethod = 'contanti' | 'carta' | 'bonifico' | 'bonus';

export interface ReceiptItem {
  description: string;
  amount: number;
}

export interface Receipt {
  id: ID;
  number: number;
  year: number;
  date: string; // YYYY-MM-DD
  patientId: ID;
  items: ReceiptItem[];
  subtotal: number;
  enpap: number;
  stamp: number;
  total: number;
  paymentMethod: PaymentMethod;
  bonusCode: string;
  bonusAmount: number;
  stsSent: boolean;
  appointmentIds: ID[];
  regime: Regime;
  cancelled: boolean;
}

export type Regime = 'forfettario' | 'ordinario';

export interface Profile {
  title: string;
  fullName: string;
  specialization: string;
  alboRegion: string;
  alboNumber: string;
  vat: string;
  taxCode: string;
  address: string;
  phone: string;
  email: string;
  iban: string;
}

export interface Settings {
  onboarded: boolean;
  profile: Profile;
  regime: Regime;
  enpap: boolean;
  enpapRate: number;
  /** Il prezzo della seduta comprende già la rivalsa ENPAP (scorporo). */
  enpapIncluded: boolean;
  stampCharged: boolean;
  defaultRate: number;
  defaultDuration: number;
  biometric: boolean;
  autoLockMinutes: number;
}

export interface DB {
  version: number;
  patients: Patient[];
  appointments: Appointment[];
  notes: SessionNote[];
  receipts: Receipt[];
  settings: Settings;
}
