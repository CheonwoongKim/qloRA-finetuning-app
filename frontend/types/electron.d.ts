export interface ElectronAPI {
  selectDirectory: (defaultPath?: string) => Promise<string | null>;
  getAppInfo: () => Promise<{
    version: string;
    platform: string;
    arch: string;
  }>;
  getPath: (name: string) => Promise<string>;
  isElectron: boolean;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
