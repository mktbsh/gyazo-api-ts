const DEFAULT_API_HOST = "https://api.gyazo.com";
const DEFAULT_UPLOAD_HOST = "https://upload.gyazo.com";

export type WebFetch = typeof globalThis.fetch;

export interface GyazoClientConfig {
  accessToken: string;
  fetch?: WebFetch;
}

/**
 * @package
 */
export interface GyazoContext {
  accessToken: string;
  apiHost: string;
  uploadHost: string;
  fetch: WebFetch;
  createApiURL: (path: string) => URL;
  createUploadURL: (path: string) => URL;
}

/**
 * @package
 */
export function createContext(config: GyazoClientConfig): GyazoContext {
  return {
    accessToken: config.accessToken,
    apiHost: DEFAULT_API_HOST,
    uploadHost: DEFAULT_UPLOAD_HOST,
    fetch: config.fetch ?? globalThis.fetch.bind(globalThis),
    createApiURL(path) {
      return new URL(path, this.apiHost);
    },
    createUploadURL(path) {
      return new URL(path, this.uploadHost);
    },
  };
}
