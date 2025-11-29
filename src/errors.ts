interface ErrorDetail {
  message: string;
  request: string;
  method: string;
}

export class GyazoAPIError extends Error {
  readonly detail: ErrorDetail | null;
  readonly headers?: Record<string, string>;

  constructor(
    public readonly status: number,
    public readonly statusText: string,
    message: string,
    detail: ErrorDetail | null = null,
    headers?: Record<string, string>
  ) {
    super(message);
    this.name = "GyazoAPIError";
    this.detail = detail;
    this.headers = headers;
  }

  static async fromResponse(response: Response): Promise<GyazoAPIError> {
    const status = response.status;
    const contentType = response.headers.get("Content-Type") || "";

    let detail: ErrorDetail | null = null;
    let message = `Gyazo API Error: ${status}`;
    if (contentType.includes("application/json")) {
      const data = await response.json();
      message = data.message || message;
      detail = data;
    } else {
      const text = await response.text();
      message = text || message;
    }

    const headers: Record<string, string> = {};
    for (const [k, v] of response.headers) {
      headers[k] = v;
    }

    return new GyazoAPIError(
      status,
      response.statusText,
      message,
      detail,
      headers
    );
  }
}
