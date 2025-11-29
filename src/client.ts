import type { GyazoCommand } from "./command";
import { createContext, type GyazoClientConfig } from "./context";
import { GyazoAPIError } from "./errors";
import { err, type GyazoResult, ok } from "./result";

export function createGyazoClient(config: GyazoClientConfig) {
  const context = createContext(config);

  async function send<Output>(
    command: GyazoCommand<Output>
  ): Promise<GyazoResult<Output, GyazoAPIError | Error>> {
    try {
      const value = await command(context);
      return ok(value);
    } catch (error) {
      if (error instanceof GyazoAPIError) {
        return err(error);
      }
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  return { send };
}
