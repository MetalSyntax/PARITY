
// Native Web Crypto API implementation for AES-GCM encryption

const APP_SECRET = import.meta.env.VITE_APP_ENCRYPTION_SECRET;
const APP_SALT = import.meta.env.VITE_APP_ENCRYPTION_SALT;

// Convert string to buffer
const str2ab = (str: string) => {
  const enc = new TextEncoder();
  return enc.encode(str);
};

// Derive a key from the secret
const getKey = async () => {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    str2ab(APP_SECRET),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: str2ab(APP_SALT), // Use salt from env
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptData = async (data: any): Promise<string> => {
  try {
      const key = await getKey();
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

      // Combine IV and encrypted data and encode as Base64 for storage
      const encryptedArray = new Uint8Array(encrypted);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv);
      combined.set(encryptedArray, iv.length);

      return btoa(String.fromCharCode(...combined));
  } catch (e) {
      console.error("Encryption failed", e);
      return JSON.stringify(data); // Fallback to plain if fails (should notify user)
  }
};

export const decryptData = async (encryptedBase64: string): Promise<any> => {
    try {
        // Quick check if input is plain JSON (migration/fallback)
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
        const key = await getKey();

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
        // Fallback: assume it might be legacy unencrypted data
        try {
            return JSON.parse(atob(encryptedBase64)); // maybe base64 but not encrypted?
        } catch (e2) {
             // as last resort, try just parsing the raw string in case it wasn't base64'd
            return JSON.parse(encryptedBase64);
        }
    }
};
