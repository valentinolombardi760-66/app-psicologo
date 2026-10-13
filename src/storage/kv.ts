import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/*
 * Archivio chiave/valore. Sul telefono AsyncStorage; nel browser IndexedDB,
 * che ha molto più spazio di localStorage (circa 5 MB) e regge meglio la crescita del diario clinico.
 */
const web = Platform.OS === 'web';
const DB_NAME = 'studio-psicologo';
const STORE = 'kv';

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function kvGet(key: string): Promise<string | null> {
  if (!web) return AsyncStorage.getItem(key);
  return ((await tx('readonly', (s) => s.get(key))) as string | undefined) ?? null;
}

export async function kvSet(key: string, value: string): Promise<void> {
  if (!web) return AsyncStorage.setItem(key, value);
  await tx('readwrite', (s) => s.put(value, key));
}

/** Chiede al browser di non cancellare i dati quando lo spazio scarseggia. */
export async function requestPersistence(): Promise<boolean> {
  if (!web) return true;
  try {
    return (await (navigator as any).storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
