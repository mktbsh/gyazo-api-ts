import type { GyazoCommand } from "../command";
import type { GyazoImage } from "../types";
import { ensureSuccess } from "../utils";

export interface GetImageInput {
  imageID: string;
}

export type GetImageOutput = GyazoImage;

export const GetImageCommand = (
  input: GetImageInput
): GyazoCommand<GetImageOutput> => {
  return async (context) => {
    const url = context.createApiURL(`/api/images/${input.imageID}`);

    const response = await context.fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${context.accessToken}`,
      },
    });

    const { data } = await ensureSuccess<GyazoImage>(response);

    return data;
  };
};
