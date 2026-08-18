/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_EMAIL?: string;
  readonly VITE_ADMIN_PASSWORD?: string;
  readonly VITE_TELEBIRR_PHONE?: string;
  readonly VITE_TELEBIRR_NAME?: string;
  readonly VITE_PRO_PRICE_ETB?: string;
  readonly VITE_SUPPORT_EMAIL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
