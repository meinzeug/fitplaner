/**
 * Autonomous Client-Side Cryptographic Vault for Private Health Data (ePA)
 * Uses Web Crypto API: PBKDF2 (SHA-256, 100,000 iterations) + AES-GCM-256.
 * Zero external servers, 100% autarkic, client-side only.
 */

import { MemberHealthDossier } from '../types';

export interface EncryptedPayload {
  ciphertext_b64: string;
  iv_b64: string;
  salt_b64: string;
  version: number;
}

/**
 * Derives an AES-GCM 256-bit key from a user PIN/passphrase and a cryptographic salt.
 */
async function deriveKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypts a health dossier object using AES-GCM-256 and the user's PIN/passphrase.
 */
export async function encryptHealthDossier(
  dossier: MemberHealthDossier,
  passphrase: string
): Promise<EncryptedPayload> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassphrase(passphrase, salt);

  const jsonStr = JSON.stringify({
    ...dossier,
    is_encrypted: true,
    last_updated: new Date().toISOString(),
  });

  const enc = new TextEncoder();
  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(jsonStr)
  );

  return {
    ciphertext_b64: bufferToBase64(encryptedBuf),
    iv_b64: bufferToBase64(iv.buffer),
    salt_b64: bufferToBase64(salt.buffer),
    version: 1,
  };
}

/**
 * Decrypts an encrypted payload with the user's PIN/passphrase.
 * Throws an error if the passphrase is wrong or the ciphertext was altered.
 */
export async function decryptHealthDossier(
  payload: EncryptedPayload,
  passphrase: string
): Promise<MemberHealthDossier> {
  const salt = new Uint8Array(base64ToBuffer(payload.salt_b64));
  const iv = new Uint8Array(base64ToBuffer(payload.iv_b64));
  const ciphertextBuf = base64ToBuffer(payload.ciphertext_b64);

  const key = await deriveKeyFromPassphrase(passphrase, salt);

  const decryptedBuf = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertextBuf
  );

  const dec = new TextDecoder();
  const jsonStr = dec.decode(decryptedBuf);
  const parsed = JSON.parse(jsonStr) as MemberHealthDossier;
  parsed.is_encrypted = false;
  return parsed;
}

/**
 * Computes a SHA-256 integrity hash of a health dossier string.
 */
export async function computeIntegrityHash(dataStr: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuf = await window.crypto.subtle.digest('SHA-256', enc.encode(dataStr));
  const hashArray = Array.from(new Uint8Array(hashBuf));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * In-memory secure session manager for the decrypted vault.
 * Automatically wipes keys from RAM on logout / timeout.
 */
class HealthVaultSession {
  private activePassphrase: string | null = null;
  private decryptedCache: Map<string, MemberHealthDossier> = new Map();
  private lastActivity: number = Date.now();
  private readonly TIMEOUT_MS = 15 * 60 * 1000; // 15 min auto-lock

  public setPassphrase(pin: string) {
    this.activePassphrase = pin;
    this.lastActivity = Date.now();
  }

  public getPassphrase(): string | null {
    if (this.isExpired()) {
      this.lockVault();
      return null;
    }
    this.lastActivity = Date.now();
    return this.activePassphrase;
  }

  public isUnlocked(): boolean {
    return this.activePassphrase !== null && !this.isExpired();
  }

  public isExpired(): boolean {
    return Date.now() - this.lastActivity > this.TIMEOUT_MS;
  }

  public setCachedDossier(memberId: string, dossier: MemberHealthDossier) {
    this.decryptedCache.set(memberId, dossier);
    this.lastActivity = Date.now();
  }

  public getCachedDossier(memberId: string): MemberHealthDossier | undefined {
    if (this.isExpired()) {
      this.lockVault();
      return undefined;
    }
    this.lastActivity = Date.now();
    return this.decryptedCache.get(memberId);
  }

  public lockVault() {
    this.activePassphrase = null;
    this.decryptedCache.clear();
  }
}

export const healthVaultSession = new HealthVaultSession();
