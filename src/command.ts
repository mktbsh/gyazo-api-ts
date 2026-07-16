import type { GyazoContext } from "./context";

export type GyazoCommand<Output> = (context: GyazoContext) => Promise<Output>;

export interface GyazoRequestOptions {
  signal?: AbortSignal;
}
