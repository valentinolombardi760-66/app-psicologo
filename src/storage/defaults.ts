import { DB, Settings } from '../types';

export const defaultSettings: Settings = {
  onboarded: false,
  profile: {
    title: 'Dott.ssa',
    fullName: '',
    specialization: 'Psicologa',
    alboRegion: '',
    alboNumber: '',
    vat: '',
    taxCode: '',
    address: '',
    phone: '',
    email: '',
    iban: '',
  },
  regime: 'forfettario',
  enpap: true,
  enpapRate: 2,
  stampCharged: true,
  defaultRate: 60,
  defaultDuration: 50,
  biometric: true,
  autoLockMinutes: 2,
};

export const emptyDB = (): DB => ({
  version: 1,
  patients: [],
  appointments: [],
  notes: [],
  receipts: [],
  settings: { ...defaultSettings, profile: { ...defaultSettings.profile } },
});
