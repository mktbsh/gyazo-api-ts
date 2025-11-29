import type { GyazoCommand } from "../command";
import { ensureSuccess } from "../utils";

export interface DeleteImageInput {
  imageID: string;
}

export interface DeleteImageOutput {
  image_id: string;
  type: string;
}

export const DeleteImageCommand = (
  input: DeleteImageInput
): GyazoCommand<DeleteImageOutput> => {
  return async (context) => {
    const url = context.createApiURL(`/api/images/${input.imageID}`);

    const response = await context.fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${context.accessToken}`,
      },
    });

    const { data } = await ensureSuccess<DeleteImageOutput>(response);

    return data;
  };
};
