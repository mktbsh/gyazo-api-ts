import type { GyazoContext } from "./context";

export type GyazoCommand<Output> = (context: GyazoContext) => Promise<Output>;
