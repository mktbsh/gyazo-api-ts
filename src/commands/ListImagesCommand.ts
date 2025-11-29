import type { GyazoCommand } from "../command";
import type { GyazoImage } from "../types";
import { ensureSuccess } from "../utils";

export interface ListImagesInput {
  page?: number;
  /** 1 - 100 */
  per_page?: number;
}

export const ListImagesCommand = (
  input: ListImagesInput = {}
): GyazoCommand<ReadonlyArray<GyazoImage>> => {
  return async (context) => {
    const url = context.createApiURL("/api/images");

    const params = url.searchParams;
    if (input.page) params.append("page", input.page.toString());
    if (input.per_page) params.append("per_page", input.per_page.toString());

    const response = await context.fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${context.accessToken}`,
      },
    });

    return ensureSuccess<ReadonlyArray<GyazoImage>>(response);
  };
};
