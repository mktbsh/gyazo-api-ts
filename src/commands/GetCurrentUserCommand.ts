import type { GyazoCommand, GyazoRequestOptions } from "../command";
import type { GyazoUser } from "../types";
import { ensureSuccess } from "../utils";

export type GetCurrentUserInput = GyazoRequestOptions;
export type GetCurrentUserOutput = GyazoUser;

interface GetCurrentUserResponse {
  user: GyazoUser;
}

export const GetCurrentUserCommand = (
  input: GetCurrentUserInput = {},
): GyazoCommand<GetCurrentUserOutput> => {
  return async (context) => {
    const url = context.createApiURL("/api/users/me");
    const init: RequestInit = { method: "GET" };
    if (input.signal) init.signal = input.signal;
    const response = await context.request(url, init);
    const { data } = await ensureSuccess<GetCurrentUserResponse>(response);
    return data.user;
  };
};
