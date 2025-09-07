/// <reference types="vite/client" />

// (opcional, para ter autocompletion das suas envs)
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // adicione outras VITE_* se precisar
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
