/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GOOGLE_CLIENT_SECRET: string
  readonly VITE_APP_ENCRYPTION_SECRET: string
  readonly VITE_APP_ENCRYPTION_SALT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
