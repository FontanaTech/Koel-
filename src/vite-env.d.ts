/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL de la API de Fontanachat, sin barra final. Si falta, el chat queda desactivado. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
