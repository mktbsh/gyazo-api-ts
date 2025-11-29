import { GyazoAPIError } from "./errors";

interface ParsedResponse<T> {
  headers: Record<string, string>;
  data: T;
}

export async function ensureSuccess<T>(
  response: Response
): Promise<ParsedResponse<T>> {
  if (!response.ok) {
    throw await GyazoAPIError.fromResponse(response);
  }
  const data: T = await response.json();
  const headers = Array.from(response.headers.entries()).reduce<
    Record<string, string>
  >((acc, [key, value]) => {
    const k = key.toLowerCase();
    acc[k] = value;
    return acc;
  }, {});

  return {
    data,
    headers,
  };
}
