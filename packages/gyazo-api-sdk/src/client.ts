import {
  bearerAuth,
  type Client,
  type Command,
  createClient,
  type Handler,
  type Middleware,
  resolveUrl,
} from "@hsblabs/http-command";

const DEFAULT_API_URL = "https://api.gyazo.com";
const DEFAULT_UPLOAD_URL = "https://upload.gyazo.com";
const DEFAULT_TIMEOUT_MS = 10_000;

declare const GYAZO_SCOPE: unique symbol;
export type GyazoScope = typeof GYAZO_SCOPE;
export type GyazoClient = Client<GyazoScope>;
export type GyazoCommand<Output> = Command<GyazoScope, Output>;

export type GyazoClientOptions = Readonly<{
  accessToken: string;
  apiUrl?: string;
  uploadUrl?: string;
  timeoutMs?: number;
  handler?: Handler;
  middleware?: ReadonlyArray<Middleware>;
}>;

export function createGyazoClient(options: GyazoClientOptions): GyazoClient {
  const accessToken = nonEmpty(options.accessToken, "accessToken");
  const apiUrl = baseUrl(options.apiUrl ?? DEFAULT_API_URL, "apiUrl");
  const uploadUrl = baseUrl(
    options.uploadUrl ?? DEFAULT_UPLOAD_URL,
    "uploadUrl",
  );
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError("timeoutMs must be a positive finite number");
  }

  return createClient<GyazoScope>({
    baseUrl: apiUrl,
    defaults: { timeoutMs },
    ...(options.handler ? { handler: options.handler } : {}),
    middleware: [bearerAuth(accessToken), ...(options.middleware ?? [])],
    resolveUrl: (_base, operationUrl) => {
      const selectedBase = operationUrl === "/api/upload" ? uploadUrl : apiUrl;
      const resolved = resolveUrl(selectedBase, operationUrl);
      if (new URL(resolved).origin !== selectedBase) {
        throw new TypeError(
          "Gyazo commands must resolve to a configured origin",
        );
      }
      return resolved;
    },
  });
}

function nonEmpty(value: string, name: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${name} must not be empty`);
  return normalized;
}

function baseUrl(value: string, name: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError(`${name} must be an absolute URL`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError(`${name} must use http or https`);
  }
  return url.origin;
}
