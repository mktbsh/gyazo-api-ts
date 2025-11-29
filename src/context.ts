const DEFAULT_API_HOST = "https://api.gyazo.com";
const DEFAULT_UPLOAD_HOST = "https://upload.gyazo.com";
const DEFAULT_TIMEOUT = 10000; // デフォルト10秒

export type WebFetch = typeof globalThis.fetch;

export interface GyazoClientConfig {
  accessToken: string;
  /**
   * リクエストのタイムアウト時間（ミリ秒）
   * @default 10000 (10秒)
   */
  timeout?: number;
  fetch?: WebFetch;
}

/**
 * @package
 */
export interface GyazoContext {
  accessToken: string;
  apiHost: string;
  uploadHost: string;
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  createApiURL: (path: string) => URL;
  createUploadURL: (path: string) => URL;
}

/**
 * @package
 */
export function createContext(config: GyazoClientConfig): GyazoContext {
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;

  const originalFetch = config.fetch ?? globalThis.fetch.bind(globalThis);

  const wrappedFetch = async (
    input: RequestInfo | URL,
    originalInit?: RequestInit
  ) => {
    const controller = new AbortController();
    const timeoutID = setTimeout(() => controller.abort(), timeout);

    const finalInit: RequestInit = { ...originalInit };
    if (!finalInit.signal) {
      finalInit.signal = controller.signal;
    }

    return originalFetch(input, finalInit).finally(() =>
      clearTimeout(timeoutID)
    );
  };

  return {
    accessToken: config.accessToken,
    apiHost: DEFAULT_API_HOST,
    uploadHost: DEFAULT_UPLOAD_HOST,
    fetch: wrappedFetch,
    createApiURL(path) {
      return new URL(path, this.apiHost);
    },
    createUploadURL(path) {
      return new URL(path, this.uploadHost);
    },
  };
}
