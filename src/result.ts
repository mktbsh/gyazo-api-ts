export type GyazoResult<T, E = Error> =
  | { ok: true; value: T; error?: never }
  | { ok: false; value?: never; error: E };

/**
 * @package
 */
export function ok<T>(value: T): GyazoResult<T, never> {
  return { ok: true, value };
}

/**
 * @package
 */
export function err<E = Error>(error: E): GyazoResult<never, E> {
  return { ok: false, error };
}
