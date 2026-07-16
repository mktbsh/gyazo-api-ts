import type { GyazoCommand, GyazoRequestOptions } from "../command";
import type { GyazoImageType } from "../types";
import { assertNonEmpty, ensureSuccess } from "../utils";

export type DeleteImageInput = GyazoRequestOptions &
  (
    | { imageId: string; imageID?: never }
    | { /** @deprecated Use imageId. */ imageID: string; imageId?: never }
  );

export interface DeleteImageOutput {
  image_id: string;
  type: GyazoImageType;
}

export const DeleteImageCommand = (
  input: DeleteImageInput,
): GyazoCommand<DeleteImageOutput> => {
  return async (context) => {
    const imageId = input.imageId ?? input.imageID;
    assertNonEmpty(imageId, "imageId");
    const url = context.createApiURL(
      `/api/images/${encodeURIComponent(imageId)}`,
    );
    const init: RequestInit = { method: "DELETE" };
    if (input.signal) init.signal = input.signal;

    const response = await context.request(url, init);
    const { data } = await ensureSuccess<DeleteImageOutput>(response);
    return data;
  };
};
