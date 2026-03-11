export {};

declare global {
  interface Window {
    sla?: {
      ping: () => string;
      openPath?: (filePath: string) => Promise<{ ok: true } | { ok: false; error: string }>;
      pickFile?: () => Promise<{ ok: true; filePath: string } | { ok: false; error: string }>;
      getPathForFile?: (file: File) => string | null;
    };
  }
}


