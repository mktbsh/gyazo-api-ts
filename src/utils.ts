import { GyazoAPIError } from "./errors";

export async function ensureSuccess<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await GyazoAPIError.fromResponse(response);
  }
  return response.json() as Promise<T>;
}
