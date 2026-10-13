import { Platform } from 'react-native';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { bytesToHex, hexToBytes, utf8ToBytes, bytesToUtf8 } from '@noble/ciphers/utils.js';
import * as Crypto from 'expo-crypto';
import { secureGet, secureSet } from './secure';

/*
 * Due modalità:
 * - Telefono (app nativa): chiave casuale custodita da Keychain/Keystore, il PIN è solo un blocco d'accesso.
 * - Browser (PWA): non esiste una cassaforte per la chiave, quindi la chiave si ricava dal PIN (PBKDF2).
 *   Senza PIN i dati non si possono decifrare; se il PIN si dimentica, servono il backup e la sua password.
 */
const web = Platform.OS === 'web';

const KEY_NAME = 'psicoapp.dbkey.v1';
const PIN_NAME = 'psicoapp.pin.v1';
const WEB_PIN_NAME = 'psicoapp.webpin.v1';
const WEB_ITER = 600_000;
const CHECK = 'psicoapp-ok';

let cachedKey: Uint8Array | null = null;

export class LockedError extends Error {}

export async function getKey(): Promise<Uint8Array> {
  if (cachedKey) return cachedKey;
  if (web) throw new LockedError('Dati bloccati: inserisci il PIN');
  let hex = await secureGet(KEY_NAME);
  if (!hex) {
    hex = bytesToHex(Crypto.getRandomBytes(32));
    await secureSet(KEY_NAME, hex);
  }
  cachedKey = hexToBytes(hex);
  return cachedKey;
}

function seal(key: Uint8Array, plain: string) {
  const nonce = Crypto.getRandomBytes(24);
  return bytesToHex(nonce) + bytesToHex(xchacha20poly1305(key, nonce).encrypt(utf8ToBytes(plain)));
}

function open(key: Uint8Array, payload: string) {
  return bytesToUtf8(xchacha20poly1305(key, hexToBytes(payload.slice(0, 48))).decrypt(hexToBytes(payload.slice(48))));
}

/** Cifra con XChaCha20-Poly1305 (cifratura autenticata). Output: hex(nonce|ciphertext). */
export async function encrypt(plain: string): Promise<string> {
  return seal(await getKey(), plain);
}

export async function decrypt(payload: string): Promise<string> {
  return open(await getKey(), payload);
}

/** PBKDF2-SHA256: WebCrypto quando c'è (veloce), altrimenti implementazione JS. */
async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const subtle = (globalThis as any).crypto?.subtle;
  if (subtle) {
    const base = await subtle.importKey('raw', utf8ToBytes(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, base, 256);
    return new Uint8Array(bits);
  }
  return pbkdf2Async(sha256, password, salt, { c: iterations, dkLen: 32 });
}

async function hashPin(pin: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export async function hasPin(): Promise<boolean> {
  return !!(await secureGet(web ? WEB_PIN_NAME : PIN_NAME));
}

/** Imposta (o cambia) il PIN. Sul web cambia anche la chiave: i dati vanno poi risalvati. */
export async function setPin(pin: string): Promise<void> {
  const salt = Crypto.getRandomBytes(16);
  if (web) {
    const key = await deriveKey(pin, salt, WEB_ITER);
    cachedKey = key;
    await secureSet(WEB_PIN_NAME, JSON.stringify({ salt: bytesToHex(salt), iter: WEB_ITER, check: seal(key, CHECK) }));
    return;
  }
  const saltHex = bytesToHex(salt);
  await secureSet(PIN_NAME, `${saltHex}$${await hashPin(pin, saltHex)}`);
}

export async function checkPin(pin: string): Promise<boolean> {
  if (web) {
    const raw = await secureGet(WEB_PIN_NAME);
    if (!raw) return false;
    const rec = JSON.parse(raw);
    const key = await deriveKey(pin, hexToBytes(rec.salt), rec.iter);
    try {
      if (open(key, rec.check) !== CHECK) return false;
    } catch {
      return false;
    }
    cachedKey = key;
    return true;
  }
  const stored = await secureGet(PIN_NAME);
  if (!stored) return false;
  const [salt, hash] = stored.split('$');
  return (await hashPin(pin, salt)) === hash;
}

export function lock() {
  if (web) cachedKey = null;
}

// ---- Backup cifrato con password (portabile su un altro dispositivo) ----
const BACKUP_ITER = 120_000;

export async function encryptBackup(json: string, password: string): Promise<string> {
  const salt = Crypto.getRandomBytes(16);
  const key = await deriveKey(password, salt, BACKUP_ITER);
  const nonce = Crypto.getRandomBytes(24);
  const ct = xchacha20poly1305(key, nonce).encrypt(utf8ToBytes(json));
  return JSON.stringify({ format: 'psicoapp-backup', v: 1, iter: BACKUP_ITER, salt: bytesToHex(salt), nonce: bytesToHex(nonce), data: bytesToHex(ct) });
}

export async function decryptBackup(file: string, password: string): Promise<string> {
  const b = JSON.parse(file);
  if (b.format !== 'psicoapp-backup') throw new Error('Questo file non è un backup dell’app');
  const key = await deriveKey(password, hexToBytes(b.salt), b.iter);
  try {
    return bytesToUtf8(xchacha20poly1305(key, hexToBytes(b.nonce)).decrypt(hexToBytes(b.data)));
  } catch {
    throw new Error('Password errata o file danneggiato');
  }
}
