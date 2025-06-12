declare global {
  interface Window {
    __TAURI__?: {
      tauri: {
        invoke<T = any>(cmd: string, args?: Record<string, any>): Promise<T>;
      };
      event: {
        listen(event: string, handler: (event: any) => void): Promise<() => void>;
        emit(event: string, payload?: any): Promise<void>;
      };
      window: {
        appWindow: {
          setTitle(title: string): Promise<void>;
          maximize(): Promise<void>;
          minimize(): Promise<void>;
          close(): Promise<void>;
        };
      };
      fs: {
        readDir(path: string): Promise<any[]>;
        readFile(path: string): Promise<Uint8Array>;
        writeFile(path: string, contents: string | Uint8Array): Promise<void>;
      };
      path: {
        appDataDir(): Promise<string>;
        documentDir(): Promise<string>;
        downloadDir(): Promise<string>;
        homeDir(): Promise<string>;
      };
    };
  }
}

export {};