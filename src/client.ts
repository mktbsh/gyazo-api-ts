import type { GyazoCommand, GyazoRequestOptions } from "./command";
import {
  DeleteImageCommand,
  type DeleteImageOutput,
} from "./commands/DeleteImageCommand";
import { GetCurrentUserCommand } from "./commands/GetCurrentUserCommand";
import { GetImageCommand } from "./commands/GetImageCommand";
import {
  GetOEmbedCommand,
  type GetOEmbedInput,
} from "./commands/GetOEmbedCommand";
import {
  ListImagesCommand,
  type ListImagesInput,
} from "./commands/ListImagesCommand";
import {
  SearchImagesCommand,
  type SearchImagesInput,
} from "./commands/SearchImagesCommand";
import {
  UploadImageCommand,
  type UploadImageInput,
} from "./commands/UploadImageCommand";
import { createContext, type GyazoClientConfig } from "./context";
import { type GyazoClientError, GyazoError, GyazoUnknownError } from "./errors";
import { err, type GyazoResult, ok } from "./result";
import type { GyazoImage } from "./types";

export function createGyazoClient(config: GyazoClientConfig) {
  const context = createContext(config);

  async function send<Output>(
    command: GyazoCommand<Output>,
  ): Promise<GyazoResult<Output, GyazoClientError>> {
    try {
      return ok(await command(context));
    } catch (error) {
      if (error instanceof GyazoError) return err(error as GyazoClientError);
      return err(new GyazoUnknownError({ cause: error }));
    }
  }

  return {
    send,
    images: {
      list: (input: ListImagesInput = {}) => send(ListImagesCommand(input)),
      get: (imageId: string, options: GyazoRequestOptions = {}) =>
        send<GyazoImage>(GetImageCommand({ imageId, ...options })),
      upload: (input: UploadImageInput) => send(UploadImageCommand(input)),
      delete: (imageId: string, options: GyazoRequestOptions = {}) =>
        send<DeleteImageOutput>(DeleteImageCommand({ imageId, ...options })),
      search: (input: SearchImagesInput) => send(SearchImagesCommand(input)),
    },
    users: {
      me: (options: GyazoRequestOptions = {}) =>
        send(GetCurrentUserCommand(options)),
    },
    oEmbed: {
      get: (input: GetOEmbedInput) => send(GetOEmbedCommand(input)),
    },
  };
}

export type GyazoClient = ReturnType<typeof createGyazoClient>;
