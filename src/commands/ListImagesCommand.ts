import type { GyazoCommand, GyazoRequestOptions } from "../command";
import type { GyazoImage } from "../types";
import {
  assertPage,
  assertPerPage,
  ensureSuccess,
  optionalIntegerHeader,
} from "../utils";

export interface ListImagesInput extends GyazoRequestOptions {
  page?: number;
  perPage?: number;
  /** @deprecated Use perPage. */
  per_page?: number;
}

export interface ListImagesOutput {
  totalCount?: number;
  currentPage?: number;
  perPage?: number;
  userType?: string;
  images: ReadonlyArray<GyazoImage>;
}

export const ListImagesCommand = (
  input: ListImagesInput = {},
): GyazoCommand<ListImagesOutput> => {
  return async (context) => {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? input.per_page ?? 20;
    assertPage(page);
    assertPerPage(perPage, "perPage");

    const url = context.createApiURL("/api/images");
    url.searchParams.set("page", page.toString());
    url.searchParams.set("per_page", perPage.toString());
    const init: RequestInit = { method: "GET" };
    if (input.signal) init.signal = input.signal;

    const response = await context.request(url, init);
    const { headers, data } =
      await ensureSuccess<ReadonlyArray<GyazoImage>>(response);
    const totalCount = optionalIntegerHeader(headers, "x-total-count");
    const currentPage = optionalIntegerHeader(headers, "x-current-page");
    const responsePerPage = optionalIntegerHeader(headers, "x-per-page");
    const userType = headers["x-user-type"];

    return {
      images: data,
      ...(totalCount === undefined ? {} : { totalCount }),
      ...(currentPage === undefined ? {} : { currentPage }),
      ...(responsePerPage === undefined ? {} : { perPage: responsePerPage }),
      ...(userType === undefined ? {} : { userType }),
    };
  };
};
