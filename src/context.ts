import {
  GyazoAbortError,
  GyazoError,
  GyazoNetworkError,
  GyazoTimeoutError,
  GyazoValidationError,
} from "./errors";

const DEFAULT_API_HOST = "https://api.gyazo.com";
const DEFAULT_UPLOAD_HOST = "https://upload.gyazo.com";
const DEFAULT_TIMEOUT = 10_000;

export type WebFetch = typeof globalThis.fetch;

export interface GyazoClientConfig {
  accessToken: string;
  /** Request timeout in milliseconds. Set to 0 to disable. @default 10000 */
  timeout?: number;
  fetch?: WebFetch;
  /** Override for proxies and tests. @default https://api.gyazo.com */
  apiHost?: string;
  /** Override for proxies and tests. @default https://upload.gyazo.com */
  uploadHost?: string;
}

/** @package */
export interface GyazoContext {
  accessToken: string;
  apiHost: string;
  uploadHost: string;
  fetch: WebFetch;
  request: WebFetch;
  createApiURL: (path: string) => URL;
  createUploadURL: (path: string) => URL;
}

/** @package */
export function createContext(config: GyazoClientConfig): GyazoContext {
  if (!config.accessToken?.trim()) {
    throw new GyazoValidationError("accessToken must be a non-empty string");
  }

  const timeout = config.timeout ?? DEFAULT_TIMEOUT;
  if (!Number.isFinite(timeout) || timeout < 0) {
    throw new GyazoValidationError(
      "timeout must be a finite number greater than or equal to 0",
    );
  }

  const apiHost = normalizeHost(config.apiHost ?? DEFAULT_API_HOST, "apiHost");
  const uploadHost = normalizeHost(
    config.uploadHost ?? DEFAULT_UPLOAD_HOST,
    "uploadHost",
  );
  const originalFetch = config.fetch ?? globalThis.fetch?.bind(globalThis);
  if (!originalFetch) {
    throw new GyazoValidationError("A Fetch API implementation is required");
  }

  const wrappedFetch: WebFetch = async (input, originalInit) => {
    const controller = new AbortController();
    const callerSignal = originalInit?.signal;
    let timedOut = false;
    let timeoutID: ReturnType<typeof setTimeout> | undefined;

    const abortFromCaller = () => controller.abort(callerSignal?.reason);
    if (callerSignal?.aborted) abortFromCaller();
    else
      callerSignal?.addEventListener("abort", abortFromCaller, { once: true });

    if (timeout > 0) {
      timeoutID = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeout);
    }

    try {
      return await originalFetch(input, {
        ...originalInit,
        signal: controller.signal,
      });
    } catch (error) {
      if (timedOut) {
        throw new GyazoTimeoutError(timeout, { cause: error });
      }
      if (callerSignal?.aborted) {
        throw new GyazoAbortError({ cause: error });
      }
      if (error instanceof GyazoError) throw error;
      throw new GyazoNetworkError({ cause: error });
    } finally {
      if (timeoutID !== undefined) clearTimeout(timeoutID);
      callerSignal?.removeEventListener("abort", abortFromCaller);
    }
  };

  const request: WebFetch = (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set("authorization", `Bearer ${config.accessToken}`);
    if (!headers.has("accept")) headers.set("accept", "application/json");
    return wrappedFetch(input, { ...init, headers });
  };

  return {
    accessToken: config.accessToken,
    apiHost,
    uploadHost,
    fetch: wrappedFetch,
    request,
    createApiURL: (path) => new URL(path, apiHost),
    createUploadURL: (path) => new URL(path, uploadHost),
  };
}

function normalizeHost(value: string, name: string): string {
  try {
    return new URL(value).origin;
  } catch (error) {
    throw new GyazoValidationError(
      `${name} must be an absolute URL: ${String(error)}`,
    );
  }
}
