import { logBonsaiError } from '@/bonsai/logs';

import { arrayBufferToBase64 } from '@/lib/arrayBufferToBase64';
import { base64ToArrayBuffer } from '@/lib/base64ToArrayBuffer';

const STORAGE_PREFIX = 'dydx.secure.';
const SALT_KEY = `${STORAGE_PREFIX}salt`;

interface EncryptedData {
  data: string;
  iv: string;
  version: number; // Version for future migrations
}

/**
 * @class SecureStorageService
 * @description Provides encrypted storage for sensitive data using the Web Crypto API.
 * Uses a browser-specific encryption key derived from a random salt.
 */
export class SecureStorageService {
  private encryptionKey: CryptoKey | null = null;

  /**
   * Get or create a browser-specific encryption key
   * The key is derived from a random salt stored in localStorage
   */
  private async getOrCreateEncryptionKey(): Promise<CryptoKey> {
    // Return cached key if available
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    // Get or create salt
    let salt = localStorage.getItem(SALT_KEY);
    if (!salt) {
      // First time - generate random salt
      const saltArray = crypto.getRandomValues(new Uint8Array(32));
      salt = arrayBufferToBase64(saltArray.buffer);
      localStorage.setItem(SALT_KEY, salt);
    }

    // Import the salt as key material
    const saltBuffer = base64ToArrayBuffer(salt);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      saltBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Derive encryption key from salt
    // Using a static pepper for additional entropy
    const pepper = new TextEncoder().encode('dydx-v4-web-secure-storage');
    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: pepper,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return this.encryptionKey;
  }

  /**
   * Encrypt and store data
   * @param key - Storage key (will be prefixed)
   * @param data - String data to encrypt
   */
  async store(key: string, data: string): Promise<void> {
    const encryptionKey = await this.getOrCreateEncryptionKey();

    // Generate random IV for this encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const encodedData = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      encodedData
    );

    // Store encrypted data with IV
    const encryptedData: EncryptedData = {
      data: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv.buffer),
      version: 1,
    };

    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(encryptedData));
  }

  /**
   * Retrieve and decrypt data
   * @param key - Storage key (will be prefixed)
   * @returns Decrypted string or null if not found
   */
  async retrieve(key: string): Promise<string | null> {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!stored) {
      return null;
    }

    try {
      const encryptedData: EncryptedData = JSON.parse(stored);
      const encryptionKey = await this.getOrCreateEncryptionKey();

      // Decrypt the data
      const encryptedBuffer = base64ToArrayBuffer(encryptedData.data);
      const ivBuffer = base64ToArrayBuffer(encryptedData.iv);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        encryptionKey,
        encryptedBuffer
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      logBonsaiError('SecureStorage', 'Failed to decrypt data', { error });
      // Data might be corrupted or key changed - remove it
      this.remove(key);
      return null;
    }
  }

  /**
   * Remove encrypted data
   * @param key - Storage key (will be prefixed)
   */
  remove(key: string): void {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  }

  /**
   * Clear all secure storage data including salt
   * WARNING: This will make all encrypted data unrecoverable
   */
  clearAll(): void {
    // Remove salt
    localStorage.removeItem(SALT_KEY);

    // Remove all encrypted items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Clear cached key
    this.encryptionKey = null;
  }

  /**
   * Check if data exists for a key
   * @param key - Storage key (will be prefixed)
   */
  has(key: string): boolean {
    return localStorage.getItem(`${STORAGE_PREFIX}${key}`) !== null;
  }
}

export const secureStorage = new SecureStorageService();
