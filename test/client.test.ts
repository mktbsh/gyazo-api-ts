import { describe, expect, it, vi } from "vitest";
import {
  createGyazoClient,
  GetImageCommand,
  GyazoAbortError,
  GyazoAPIError,
  GyazoNetworkError,
  GyazoResponseError,
  GyazoTimeoutError,
  GyazoValidationError,
} from "../src";

const image = {
  image_id: "abc123",
  permalink_url: null,
  thumb_url: null,
  type: "png",
  created_at: "2026-01-01T00:00:00Z",
};

describe("Gyazo client", () => {
  it("lists images and parses pagination headers", async () => {
    const fetch = mockFetch(() =>
      json([image], {
        headers: {
          "x-total-count": "21",
          "x-current-page": "2",
          "x-per-page": "10",
          "x-user-type": "pro",
        },
      }),
    );
    const client = createGyazoClient({ accessToken: "token", fetch });

    const result = await client.images.list({ page: 2, perPage: 10 });

    expect(result).toEqual({
      ok: true,
      value: {
        images: [image],
        totalCount: 21,
        currentPage: 2,
        perPage: 10,
        userType: "pro",
      },
    });
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(String(url)).toBe(
      "https://api.gyazo.com/api/images?page=2&per_page=10",
    );
    expect(new Headers(init?.headers).get("authorization")).toBe(
      "Bearer token",
    );
  });

  it("keeps the command API and deprecated imageID input working", async () => {
    const fetch = mockFetch(() => json(image));
    const client = createGyazoClient({ accessToken: "token", fetch });

    const result = await client.send(GetImageCommand({ imageID: "a/b" }));

    expect(result).toEqual({ ok: true, value: image });
    expect(String(fetch.mock.calls[0]?.[0])).toBe(
      "https://api.gyazo.com/api/images/a%2Fb",
    );
  });

  it("gets and deletes an image through direct methods", async () => {
    const fetch = mockFetch()
      .mockResolvedValueOnce(json(image))
      .mockResolvedValueOnce(json({ image_id: "abc123", type: "png" }));
    const client = createGyazoClient({ accessToken: "token", fetch });

    expect(await client.images.get("abc123")).toEqual({
      ok: true,
      value: image,
    });
    expect(await client.images.delete("abc123")).toEqual({
      ok: true,
      value: { image_id: "abc123", type: "png" },
    });
    expect(fetch.mock.calls[1]?.[1]?.method).toBe("DELETE");
  });

  it("uploads optional empty metadata and does not invent created_at", async () => {
    const fetch = mockFetch(() =>
      json({
        image_id: "abc123",
        permalink_url: "https://gyazo.com/abc123",
        thumb_url: "https://i.gyazo.com/thumb.png",
        url: "https://i.gyazo.com/abc123.png",
        type: "png",
      }),
    );
    const client = createGyazoClient({ accessToken: "token", fetch });

    await client.images.upload({
      image: new Blob(["image"], { type: "image/png" }),
      filename: "image.png",
      desc: "",
      metadataIsPublic: false,
    });

    const body = fetch.mock.calls[0]?.[1]?.body;
    expect(body).toBeInstanceOf(FormData);
    const form = body as FormData;
    expect(form.get("desc")).toBe("");
    expect(form.get("metadata_is_public")).toBe("false");
    expect(form.has("created_at")).toBe(false);
  });

  it("supports deprecated upload field names and zero created_at", async () => {
    const fetch = mockFetch(() => json({ image_id: "id", type: "png" }));
    const client = createGyazoClient({ accessToken: "token", fetch });

    await client.images.upload({
      image: new Blob(["image"]),
      filename: "image.png",
      access_policy: "only_me",
      metadata_is_public: true,
      referer_url: "",
      collection_id: "collection",
      created_at: 0,
    });

    const form = fetch.mock.calls[0]?.[1]?.body as FormData;
    expect(Object.fromEntries(form.entries())).toMatchObject({
      access_policy: "only_me",
      metadata_is_public: "true",
      referer_url: "",
      collection_id: "collection",
      created_at: "0",
    });
  });

  it("supports array and object search responses", async () => {
    const fetch = mockFetch()
      .mockResolvedValueOnce(json([image]))
      .mockResolvedValueOnce(
        json({ captures: [image], number_of_captures: 1, query: "actual" }),
      );
    const client = createGyazoClient({ accessToken: "token", fetch });

    expect(await client.images.search({ query: "cat" })).toEqual({
      ok: true,
      value: { images: [image], query: "cat" },
    });
    expect(
      await client.images.search({ query: "cat", page: 2, per: 5 }),
    ).toEqual({
      ok: true,
      value: { images: [image], query: "actual", totalCount: 1 },
    });
    expect(String(fetch.mock.calls[1]?.[0])).toContain("page=2&per=5");
  });

  it("gets the current user and unauthenticated oEmbed data", async () => {
    const user = {
      email: "user@example.com",
      name: "User",
      profile_image: "https://example.com/user.png",
      uid: "uid",
    };
    const embed = {
      version: "1.0",
      type: "photo",
      provider_name: "Gyazo",
      provider_url: "https://gyazo.com",
      url: "https://i.gyazo.com/image.png",
      width: 100,
      height: 100,
    };
    const fetch = mockFetch()
      .mockResolvedValueOnce(json({ user }))
      .mockResolvedValueOnce(json(embed));
    const client = createGyazoClient({ accessToken: "token", fetch });

    expect(await client.users.me()).toEqual({ ok: true, value: user });
    expect(await client.oEmbed.get({ url: "https://gyazo.com/id" })).toEqual({
      ok: true,
      value: embed,
    });
    expect(
      new Headers(fetch.mock.calls[1]?.[1]?.headers).has("authorization"),
    ).toBe(false);
  });
});

describe("errors and validation", () => {
  it("returns a typed API error with status helpers", async () => {
    const fetch = mockFetch(() =>
      json(
        { message: "Upgrade required", request: "/api/search", method: "GET" },
        { status: 402, statusText: "Payment Required" },
      ),
    );
    const client = createGyazoClient({ accessToken: "token", fetch });

    const result = await client.images.search({ query: "cat" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(GyazoAPIError);
    expect((result.error as GyazoAPIError).isProRequired).toBe(true);
  });

  it("preserves the API status for malformed JSON error bodies", async () => {
    const fetch = mockFetch(
      () =>
        new Response("{", {
          status: 429,
          statusText: "Too Many Requests",
          headers: { "content-type": "application/json" },
        }),
    );
    const client = createGyazoClient({ accessToken: "token", fetch });

    const result = await client.images.list();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(GyazoAPIError);
    expect((result.error as GyazoAPIError).isRateLimited).toBe(true);
  });

  it("returns a response error for invalid success JSON", async () => {
    const fetch = mockFetch(
      () => new Response("not-json", { status: 200, statusText: "OK" }),
    );
    const client = createGyazoClient({ accessToken: "token", fetch });
    const result = await client.images.list();
    expect(result.ok ? undefined : result.error).toBeInstanceOf(
      GyazoResponseError,
    );
  });

  it("returns validation errors for invalid pagination and search", async () => {
    const client = createGyazoClient({
      accessToken: "token",
      fetch: mockFetch(),
    });
    const invalidPage = await client.images.list({ page: 0 });
    const invalidPerPage = await client.images.list({ perPage: 101 });
    const invalidQuery = await client.images.search({ query: "x".repeat(201) });

    for (const result of [invalidPage, invalidPerPage, invalidQuery]) {
      expect(result.ok ? undefined : result.error).toBeInstanceOf(
        GyazoValidationError,
      );
    }
  });

  it("rejects invalid client configuration", () => {
    expect(() => createGyazoClient({ accessToken: "" })).toThrow(
      GyazoValidationError,
    );
    expect(() =>
      createGyazoClient({ accessToken: "token", timeout: -1 }),
    ).toThrow(GyazoValidationError);
    expect(() =>
      createGyazoClient({ accessToken: "token", apiHost: "relative" }),
    ).toThrow(GyazoValidationError);
  });

  it("classifies network, timeout, and caller abort errors", async () => {
    const network = createGyazoClient({
      accessToken: "token",
      fetch: mockFetch(() => Promise.reject(new TypeError("offline"))),
    });
    const networkResult = await network.images.list();
    expect(networkResult.ok ? undefined : networkResult.error).toBeInstanceOf(
      GyazoNetworkError,
    );

    const waitingFetch = mockFetch(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    const timeout = createGyazoClient({
      accessToken: "token",
      timeout: 5,
      fetch: waitingFetch,
    });
    const timeoutResult = await timeout.images.list();
    expect(timeoutResult.ok ? undefined : timeoutResult.error).toBeInstanceOf(
      GyazoTimeoutError,
    );

    const controller = new AbortController();
    const aborted = createGyazoClient({
      accessToken: "token",
      fetch: waitingFetch,
    });
    const promise = aborted.images.list({ signal: controller.signal });
    controller.abort();
    const abortResult = await promise;
    expect(abortResult.ok ? undefined : abortResult.error).toBeInstanceOf(
      GyazoAbortError,
    );
  });

  it("wraps errors from custom commands as unknown errors", async () => {
    const client = createGyazoClient({
      accessToken: "token",
      fetch: mockFetch(),
    });
    const result = await client.send(async () => {
      throw "unexpected";
    });

    expect(result.ok ? undefined : result.error.kind).toBe("unknown");
  });
});

function json(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(value), { ...init, headers });
}

function mockFetch(
  implementation: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Response | Promise<Response> = () => json([]),
) {
  return vi.fn(implementation) as unknown as ReturnType<typeof vi.fn> &
    typeof fetch;
}
