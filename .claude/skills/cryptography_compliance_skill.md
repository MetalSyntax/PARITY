# AI Skill: Cryptographic Security & Secrets Management

Security is critical to PARITY. Never leak unencrypted user data to persistent storage.

## Cryptography Rules:
1. **At Rest Cryptography:**
   - Any new entity or database field representing financial actions or user info must be processed through the encryption layer.
   - Use `services/crypto.ts` functions `encryptData` and `decryptData`.
2. **Key Derivation (PBKDF2):**
   - Derived keys should never be stored in plain text. Keep derived cryptographic keys active only in browser memory.
3. **Environment Secrets:**
   - All external keys, salts, and secret codes must be populated from environment variables (`.env`).
   - Use `import.meta.env.VITE_GOOGLE_CLIENT_ID` for frontend variables.
   - Never commit `.env` or production credentials to git.
4. **Third Party Libraries Alert:**
   - Do not pass encrypted payloads to external analysis or tracking tools. All charts and calculations must happen locally.
