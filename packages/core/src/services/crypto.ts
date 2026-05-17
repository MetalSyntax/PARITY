
// Platform-agnostic crypto service for Parity

export interface CryptoEngine {
  encrypt: (data: any) => Promise<string>;
  decrypt: (encrypted: string) => Promise<any>;
}

let _engine: CryptoEngine | null = null;

/**
 * Injects a platform-specific crypto engine (e.g., Expo Crypto for mobile)
 */
export const setCryptoEngine = (engine: CryptoEngine) => {
  _engine = engine;
};

// --- Web Crypto Implementation (Default) ---

// Convert string to buffer
const str2ab = (str: string) => {
  const enc = new TextEncoder();
  return enc.encode(str);
};

let _webSecret = 'fallback_secret';
let _webSalt = 'fallback_salt';
let _cachedKeyPromise: Promise<CryptoKey> | null = null;

/**
 * Sets the PBKDF2 secret/salt for the web crypto fallback.
 * Call this at app startup from the web app using import.meta.env values.
 * Not needed on mobile — setCryptoEngine() bypasses this entirely.
 */
export const setWebCryptoSecrets = (secret: string, salt: string) => {
  _webSecret = secret;
  _webSalt = salt;
  _cachedKeyPromise = null; // reset cached key so next call re-derives
};

const getWebKey = (): Promise<CryptoKey> => {
  if (_cachedKeyPromise) return _cachedKeyPromise;

  const secret = _webSecret;
  const salt = _webSalt;

  _cachedKeyPromise = (async () => {
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      str2ab(secret),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: str2ab(salt),
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  })();

  return _cachedKeyPromise;
};

const webEncrypt = async (data: any): Promise<string> => {
  try {
      const key = await getWebKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const strData = JSON.stringify(data);
      const encodedData = str2ab(strData);

      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        key,
        encodedData
      );

      const encryptedArray = new Uint8Array(encrypted);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv);
      combined.set(encryptedArray, iv.length);

      let binary = "";
      const CHUNK_SIZE = 0x8000;
      for (let i = 0; i < combined.length; i += CHUNK_SIZE) {
        binary += String.fromCharCode.apply(null, combined.subarray(i, i + CHUNK_SIZE) as any);
      }

      return btoa(binary);
  } catch (e) {
      console.error("Web encryption failed", e);
      return JSON.stringify(data);
  }
};

const webDecrypt = async (encryptedBase64: string): Promise<any> => {
    try {
        if (encryptedBase64.trim().startsWith('{')) {
            return JSON.parse(encryptedBase64);
        }

        const combinedStr = atob(encryptedBase64);
        const combined = new Uint8Array(combinedStr.length);
        for (let i = 0; i < combinedStr.length; i++) {
            combined[i] = combinedStr.charCodeAt(i);
        }

        const iv = combined.slice(0, 12);
        const data = combined.slice(12);
        const key = await getWebKey();

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            data
        );

        const dec = new TextDecoder();
        return JSON.parse(dec.decode(decrypted));
    } catch (e) {
        try {
            return JSON.parse(atob(encryptedBase64));
        } catch (e2) {
            try {
                return JSON.parse(encryptedBase64);
            } catch (e3) {
                console.warn("Data could not be decrypted or parsed.");
                throw new Error("Decryption and fallback failed");
            }
        }
    }
};

// --- Exported Functions ---

export const encryptData = async (data: any): Promise<string> => {
  if (_engine) return _engine.encrypt(data);
  return webEncrypt(data);
};

export const decryptData = async (encryptedBase64: string): Promise<any> => {
  if (_engine) return _engine.decrypt(encryptedBase64);
  return webDecrypt(encryptedBase64);
};
