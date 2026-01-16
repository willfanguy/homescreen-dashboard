/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ICAL_URL_PERSONAL: string;
  readonly VITE_ICAL_URL_SHARED: string;
  readonly VITE_ICAL_URL_TRASH: string;
  readonly VITE_GOOGLE_CALENDAR_ID: string;
  readonly VITE_ICLOUD_ALBUM_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
