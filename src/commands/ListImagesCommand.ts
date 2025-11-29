import type { GyazoCommand } from "../command";
import type { GyazoImage } from "../types";
import { ensureSuccess } from "../utils";

export interface ListImagesInput {
  page?: number;
  /** 1 - 100 */
  per_page?: number;
}

export interface ListImagesOutput {
  totalCount?: string;
  currentPage?: string;
  perPage?: string;
  userType?: string;
  images: ReadonlyArray<GyazoImage>;
}

export const ListImagesCommand = (
  input: ListImagesInput = {
    page: 1,
    per_page: 20,
  }
): GyazoCommand<ListImagesOutput> => {
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

    const { headers, data } = await ensureSuccess<ReadonlyArray<GyazoImage>>(
      response
    );

    return {
      images: data,
      totalCount: headers["x-total-count"],
      currentPage: headers["x-current-page"],
      perPage: headers["x-per-page"],
      userType: headers["x-user-type"],
    } satisfies ListImagesOutput;
  };
};
