import type { GyazoCommand, GyazoRequestOptions } from "../command";
import { GyazoValidationError } from "../errors";
import type { GyazoImage } from "../types";
import {
  assertNonEmpty,
  assertPage,
  assertPerPage,
  ensureSuccess,
} from "../utils";

export interface SearchImagesInput extends GyazoRequestOptions {
  query: string;
  page?: number;
  per?: number;
}

export interface SearchImagesOutput {
  images: ReadonlyArray<GyazoImage>;
  query: string;
  totalCount?: number;
}

interface ObjectSearchResponse {
  captures: ReadonlyArray<GyazoImage>;
  number_of_captures?: number;
  query?: string;
}

type SearchResponse = ReadonlyArray<GyazoImage> | ObjectSearchResponse;

export const SearchImagesCommand = (
  input: SearchImagesInput,
): GyazoCommand<SearchImagesOutput> => {
  return async (context) => {
    assertNonEmpty(input.query, "query");
    if (input.query.length > 200) {
      throw new GyazoValidationError("query must be 200 characters or fewer");
    }
    const page = input.page ?? 1;
    const per = input.per ?? 20;
    assertPage(page);
    assertPerPage(per, "per");

    const url = context.createApiURL("/api/search");
    url.searchParams.set("query", input.query);
    url.searchParams.set("page", page.toString());
    url.searchParams.set("per", per.toString());
    const init: RequestInit = { method: "GET" };
    if (input.signal) init.signal = input.signal;

    const response = await context.request(url, init);
    const { data } = await ensureSuccess<SearchResponse>(response);
    if (Array.isArray(data)) return { images: data, query: input.query };

    const objectData = data as ObjectSearchResponse;
    return {
      images: objectData.captures,
      query: objectData.query ?? input.query,
      ...(objectData.number_of_captures === undefined
        ? {}
        : { totalCount: objectData.number_of_captures }),
    };
  };
};
