import {
  GyazoAPIError,
  GyazoResponseError,
  GyazoValidationError,
} from "./errors";

export interface ParsedResponse<T> {
  headers: Readonly<Record<string, string>>;
  data: T;
}

export async function ensureSuccess<T>(
  response: Response,
): Promise<ParsedResponse<T>> {
  if (!response.ok) throw await GyazoAPIError.fromResponse(response);

  const body = await response.text();
  try {
    return {
      data: JSON.parse(body) as T,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    throw new GyazoResponseError(
      "Gyazo returned an invalid JSON response",
      response.status,
      body,
      { cause: error },
    );
  }
}

export function assertNonEmpty(value: string, name: string): void {
  if (!value.trim())
    throw new GyazoValidationError(`${name} must not be empty`);
}

export function assertPage(value: number | undefined): void {
  if (value !== undefined && (!Number.isInteger(value) || value < 1)) {
    throw new GyazoValidationError(
      "page must be an integer greater than or equal to 1",
    );
  }
}

export function assertPerPage(value: number | undefined, name: string): void {
  if (
    value !== undefined &&
    (!Number.isInteger(value) || value < 1 || value > 100)
  ) {
    throw new GyazoValidationError(
      `${name} must be an integer between 1 and 100`,
    );
  }
}

export function optionalIntegerHeader(
  headers: Readonly<Record<string, string>>,
  name: string,
): number | undefined {
  const raw = headers[name];
  if (raw === undefined) return undefined;
  const value = Number.parseInt(raw, 10);
  return Number.isNaN(value) ? undefined : value;
}
