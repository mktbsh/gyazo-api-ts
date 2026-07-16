import type { GyazoCommand, GyazoRequestOptions } from "../command";
import type { GyazoImage } from "../types";
import { assertNonEmpty, ensureSuccess } from "../utils";

export type GetImageInput = GyazoRequestOptions &
  (
    | { imageId: string; imageID?: never }
    | { /** @deprecated Use imageId. */ imageID: string; imageId?: never }
  );

export type GetImageOutput = GyazoImage;

export const GetImageCommand = (
  input: GetImageInput,
): GyazoCommand<GetImageOutput> => {
  return async (context) => {
    const imageId = input.imageId ?? input.imageID;
    assertNonEmpty(imageId, "imageId");
    const url = context.createApiURL(
      `/api/images/${encodeURIComponent(imageId)}`,
    );
    const init: RequestInit = { method: "GET" };
    if (input.signal) init.signal = input.signal;

    const response = await context.request(url, init);
    const { data } = await ensureSuccess<GyazoImage>(response);
    return data;
  };
};
