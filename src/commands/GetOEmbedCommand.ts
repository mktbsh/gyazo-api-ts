import type { GyazoCommand, GyazoRequestOptions } from "../command";
import type { GyazoOEmbed } from "../types";
import { assertNonEmpty, ensureSuccess } from "../utils";

export interface GetOEmbedInput extends GyazoRequestOptions {
  url: string;
}

export type GetOEmbedOutput = GyazoOEmbed;

export const GetOEmbedCommand = (
  input: GetOEmbedInput,
): GyazoCommand<GetOEmbedOutput> => {
  return async (context) => {
    assertNonEmpty(input.url, "url");
    const url = context.createApiURL("/api/oembed");
    url.searchParams.set("url", input.url);
    const init: RequestInit = { method: "GET" };
    if (input.signal) init.signal = input.signal;
    const response = await context.fetch(url, init);
    const { data } = await ensureSuccess<GetOEmbedOutput>(response);
    return data;
  };
};
