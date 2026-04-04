/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_FIREBASE_APIKEY?: string;
  readonly VITE_FIREBASE_AUTHDOMAIN?: string;
  readonly VITE_FIREBASE_PROJECTID?: string;
  readonly VITE_FIREBASE_STORAGEBUCKET?: string;
  readonly VITE_FIREBASE_MESSAGINGSENDERID?: string;
  readonly VITE_FIREBASE_APPID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
