import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { Appointment, DB, Patient, Receipt, SessionNote, Settings } from '../types';
import { decrypt, encrypt, LockedError } from './crypto';
import { kvGet, kvSet } from './kv';
import { defaultSettings, emptyDB } from './defaults';

const DB_KEY = 'psicoapp.db.enc.v1';

export const newId = () => Crypto.randomUUID();

function migrate(raw: any): DB {
  const base = emptyDB();
  return {
    ...base,
    ...raw,
    settings: {
      ...defaultSettings,
      ...(raw?.settings ?? {}),
      profile: { ...defaultSettings.profile, ...(raw?.settings?.profile ?? {}) },
    },
  };
}

export async function loadDB(): Promise<DB> {
  const payload = await kvGet(DB_KEY);
  if (!payload) return emptyDB();
  return migrate(JSON.parse(await decrypt(payload)));
}

async function saveDB(db: DB) {
  await kvSet(DB_KEY, await encrypt(JSON.stringify(db)));
}

export function parseBackup(json: string): DB {
  const raw = JSON.parse(json);
  if (!raw || !Array.isArray(raw.patients) || !raw.settings) throw new Error('File di backup non valido');
  return migrate(raw);
}

type Ctx = {
  db: DB;
  ready: boolean;
  savePatient: (p: Patient) => void;
  deletePatient: (id: string) => void;
  saveAppointment: (a: Appointment) => void;
  deleteAppointment: (id: string) => void;
  saveNote: (n: SessionNote) => void;
  deleteNote: (id: string) => void;
  saveReceipt: (r: Receipt) => void;
  updateSettings: (s: Partial<Settings>) => void;
  replaceDB: (db: DB) => void;
  /** Rilegge i dati cifrati (nel browser va chiamato dopo lo sblocco). */
  load: () => Promise<void>;
  /** Risalva tutto, ad esempio dopo il cambio PIN nel browser. */
  persist: () => void;
  nextReceiptNumber: (year: number) => number;
};

const StoreContext = createContext<Ctx | null>(null);

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const copy = list.slice();
  copy[i] = item;
  return copy;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(emptyDB());
  const [ready, setReady] = useState(false);
  const saving = useRef<Promise<void>>(Promise.resolve());

  const load = useCallback(async () => {
    try {
      setDb(await loadDB());
    } catch (e) {
      console.warn('Impossibile leggere i dati', e);
    }
  }, []);

  useEffect(() => {
    // Nel browser i dati restano cifrati finché non si inserisce il PIN
    if (Platform.OS === 'web') setReady(true);
    else load().finally(() => setReady(true));
  }, []);

  const mutate = useCallback((fn: (d: DB) => DB) => {
    setDb((prev) => {
      const next = fn(prev);
      // salvataggi in coda, così non si sovrascrivono a vicenda
      saving.current = saving.current.then(() => saveDB(next)).catch((e) => {
        // Prima della creazione del PIN (solo browser) non c'è ancora una chiave: si salva subito dopo
        if (!(e instanceof LockedError)) console.warn('Salvataggio fallito', e);
      });
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      db,
      ready,
      savePatient: (p) => mutate((d) => ({ ...d, patients: upsert(d.patients, p) })),
      deletePatient: (id) =>
        mutate((d) => ({
          ...d,
          patients: d.patients.filter((p) => p.id !== id),
          appointments: d.appointments.filter((a) => a.patientId !== id),
          notes: d.notes.filter((n) => n.patientId !== id),
          // le ricevute restano: vanno conservate 10 anni
        })),
      saveAppointment: (a) => mutate((d) => ({ ...d, appointments: upsert(d.appointments, a) })),
      deleteAppointment: (id) => mutate((d) => ({ ...d, appointments: d.appointments.filter((a) => a.id !== id) })),
      saveNote: (n) => mutate((d) => ({ ...d, notes: upsert(d.notes, n) })),
      deleteNote: (id) => mutate((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) })),
      saveReceipt: (r) =>
        mutate((d) => ({
          ...d,
          receipts: upsert(d.receipts, r),
          appointments: d.appointments.map((a) =>
            r.appointmentIds.includes(a.id)
              ? { ...a, receiptId: r.cancelled ? undefined : r.id, paid: r.cancelled ? a.paid : true }
              : a,
          ),
        })),
      updateSettings: (s) => mutate((d) => ({ ...d, settings: { ...d.settings, ...s } })),
      replaceDB: (next) => mutate(() => next),
      load,
      persist: () => mutate((d) => ({ ...d })),
      nextReceiptNumber: (year) =>
        db.receipts.filter((r) => r.year === year).reduce((m, r) => Math.max(m, r.number), 0) + 1,
    }),
    [db, ready, mutate, load],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore fuori dal provider');
  return ctx;
}

export function usePatient(id?: string) {
  const { db } = useStore();
  return db.patients.find((p) => p.id === id);
}
