export type GyazoErrorKind =
  | "abort"
  | "api"
  | "network"
  | "response"
  | "timeout"
  | "unknown"
  | "validation";

export abstract class GyazoError extends Error {
  abstract readonly kind: GyazoErrorKind;
}

export interface GyazoAPIErrorDetail {
  message?: string;
  request?: string;
  method?: string;
  [key: string]: unknown;
}

export class GyazoAPIError extends GyazoError {
  readonly kind = "api" as const;

  constructor(
    public readonly status: number,
    public readonly statusText: string,
    message: string,
    public readonly detail: GyazoAPIErrorDetail | null = null,
    public readonly headers: Readonly<Record<string, string>> = {},
  ) {
    super(message);
    this.name = "GyazoAPIError";
  }

  get isAuthenticationError(): boolean {
    return this.status === 401;
  }

  get isProRequired(): boolean {
    return this.status === 402;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }

  static async fromResponse(response: Response): Promise<GyazoAPIError> {
    const headers = Object.fromEntries(response.headers.entries());
    let body = "";

    try {
      body = await response.text();
    } catch {
      // Preserve the HTTP status even when the response body cannot be read.
    }

    let detail: GyazoAPIErrorDetail | null = null;
    let message = body || `Gyazo API error: ${response.status}`;

    if (
      body &&
      response.headers.get("content-type")?.includes("application/json")
    ) {
      try {
        const parsed: unknown = JSON.parse(body);
        if (isRecord(parsed)) {
          detail = parsed;
          if (typeof parsed.message === "string") message = parsed.message;
        }
      } catch {
        // Fall back to the raw body without losing the HTTP status.
      }
    }

    return new GyazoAPIError(
      response.status,
      response.statusText,
      message,
      detail,
      headers,
    );
  }
}

export class GyazoValidationError extends GyazoError {
  readonly kind = "validation" as const;

  constructor(message: string) {
    super(message);
    this.name = "GyazoValidationError";
  }
}

export class GyazoTimeoutError extends GyazoError {
  readonly kind = "timeout" as const;

  constructor(
    public readonly timeoutMs: number,
    options?: ErrorOptions,
  ) {
    super(`Gyazo request timed out after ${timeoutMs} ms`, options);
    this.name = "GyazoTimeoutError";
  }
}

export class GyazoAbortError extends GyazoError {
  readonly kind = "abort" as const;

  constructor(options?: ErrorOptions) {
    super("Gyazo request was aborted", options);
    this.name = "GyazoAbortError";
  }
}

export class GyazoNetworkError extends GyazoError {
  readonly kind = "network" as const;

  constructor(options?: ErrorOptions) {
    super("Failed to communicate with the Gyazo API", options);
    this.name = "GyazoNetworkError";
  }
}

export class GyazoResponseError extends GyazoError {
  readonly kind = "response" as const;

  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "GyazoResponseError";
  }
}

export class GyazoUnknownError extends GyazoError {
  readonly kind = "unknown" as const;

  constructor(options?: ErrorOptions) {
    super("Unexpected Gyazo client error", options);
    this.name = "GyazoUnknownError";
  }
}

export type GyazoClientError =
  | GyazoAbortError
  | GyazoAPIError
  | GyazoNetworkError
  | GyazoResponseError
  | GyazoTimeoutError
  | GyazoUnknownError
  | GyazoValidationError;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
