/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "false" to hide the pace badge; any other value or unset shows it. */
  readonly VITE_FLAG_PACE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
