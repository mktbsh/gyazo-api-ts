import { describe, expect, it, vi } from "vitest";
import {
  createGyazoClient,
  deleteImage,
  getCurrentUser,
  getImage,
  getOEmbed,
  isHttpCommandError,
  listImages,
  searchImages,
  uploadImage,
} from "../src";

const image = {
  image_id: "abc123",
  permalink_url: null,
  thumb_url: null,
  type: "png",
  created_at: "2026-01-01T00:00:00Z",
};

const fullImage = {
  ...image,
  permalink_url: "https://gyazo.com/abc123",
  thumb_url: "https://i.gyazo.com/thumb.png",
  url: null,
  access_policy: "only_me",
  alt_text: "diagram",
  metadata: {
    app: "gyazoctl",
    title: "Title",
    url: null,
    desc: "Description",
    original_title: null,
    original_url: "https://example.com",
  },
  ocr: { locale: "en", description: "text" },
  video_length: 1.5,
  mp4_url: "https://i.gyazo.com/video.mp4",
};

describe("gyazo-api-sdk", () => {
  it("uses the scoped runtime for auth, query, and pagination", async () => {
    const requests: Array<{ url: string; authorization: string | null }> = [];
    const client = createGyazoClient({
      accessToken: " token ",
      handler: async ({ request }) => {
        requests.push({
          url: request.url,
          authorization: new Headers(request.headers).get("authorization"),
        });
        return {
          response: json([image], {
            headers: {
              "x-total-count": "21",
              "x-current-page": "2",
              "x-per-page": "10",
              "x-user-type": "pro",
            },
          }),
        };
      },
    });

    await expect(
      client.send(listImages({ page: 2, perPage: 10 })),
    ).resolves.toEqual({
      images: [image],
      totalCount: 21,
      currentPage: 2,
      perPage: 10,
      userType: "pro",
    });
    expect(requests).toEqual([
      {
        url: "https://api.gyazo.com/api/images?page=2&per_page=10",
        authorization: "Bearer token",
      },
    ]);
  });

  it("encodes image IDs and routes uploads to the upload host", async () => {
    const requests: Array<{ url: string; body?: unknown }> = [];
    const client = createGyazoClient({
      accessToken: "token",
      handler: async ({ request }) => {
        requests.push({ url: request.url, body: request.body });
        return {
          response:
            request.method === "POST"
              ? json({
                  image_id: "abc123",
                  permalink_url: "https://gyazo.com/abc123",
                  thumb_url: "https://i.gyazo.com/thumb.png",
                  url: "https://i.gyazo.com/abc123.png",
                  type: "png",
                })
              : json(image),
        };
      },
    });

    await client.send(getImage({ imageId: "a/b" }));
    await client.send(
      uploadImage({
        image: new Blob(["image"]),
        filename: "image.png",
        metadataIsPublic: false,
      }),
    );

    expect(requests[0]?.url).toBe("https://api.gyazo.com/api/images/a%2Fb");
    expect(requests[1]?.url).toBe("https://upload.gyazo.com/api/upload");
    expect(requests[1]?.body).toBeInstanceOf(FormData);
    const uploadForm = requests[1]?.body;
    if (!(uploadForm instanceof FormData)) throw new Error("Expected FormData");
    expect(uploadForm.get("metadata_is_public")).toBe("false");
  });

  it("validates inputs and service responses at the boundary", async () => {
    expect(() => listImages({ page: 0 })).toThrow(RangeError);
    expect(() => searchImages({ query: " " })).toThrow(TypeError);

    const client = createGyazoClient({
      accessToken: "token",
      handler: async () => ({ response: json({ unexpected: true }) }),
    });
    const error = await client
      .send(getImage({ imageId: "id" }))
      .catch((value: unknown) => value);
    expect(isHttpCommandError(error) && error.code).toBe("PARSE");
  });

  it("keeps HTTP failures in the shared error model", async () => {
    const client = createGyazoClient({
      accessToken: "token",
      handler: async () => ({
        response: json({ message: "Upgrade required" }, { status: 402 }),
      }),
    });

    const error = await client
      .send(searchImages({ query: "cat" }))
      .catch((value: unknown) => value);
    expect(isHttpCommandError(error)).toBe(true);
    if (isHttpCommandError(error)) {
      expect(error.code).toBe("HTTP");
      expect(error.status).toBe(402);
    }
  });

  it("parses every public API response shape", async () => {
    const client = createGyazoClient({
      accessToken: "token",
      handler: async ({ request }) => {
        const url = new URL(request.url);
        if (url.pathname === "/api/images" && request.method === "GET") {
          return { response: json([fullImage]) };
        }
        if (
          url.pathname.startsWith("/api/images/") &&
          request.method === "DELETE"
        ) {
          return { response: json({ image_id: "abc123", type: "png" }) };
        }
        if (url.pathname === "/api/search") {
          return {
            response:
              url.searchParams.get("query") === "cat"
                ? json([fullImage])
                : json({
                    captures: [fullImage],
                    number_of_captures: 1,
                    query: "server query",
                  }),
          };
        }
        if (url.pathname === "/api/users/me") {
          return {
            response: json({
              user: {
                email: "user@example.com",
                name: "User",
                profile_image: "https://example.com/user.png",
                uid: "uid",
              },
            }),
          };
        }
        if (url.pathname === "/api/oembed") {
          return {
            response: json({
              version: "1.0",
              type: "photo",
              provider_name: "Gyazo",
              provider_url: "https://gyazo.com",
              url: "https://i.gyazo.com/abc123.png",
              width: 100,
              height: 80,
            }),
          };
        }
        return { response: json(fullImage) };
      },
    });

    expect((await client.send(listImages())).images).toEqual([fullImage]);
    await expect(
      client.send(deleteImage({ imageId: "abc123" })),
    ).resolves.toEqual({
      image_id: "abc123",
      type: "png",
    });
    await expect(client.send(searchImages({ query: "cat" }))).resolves.toEqual({
      images: [fullImage],
      query: "cat",
    });
    await expect(client.send(searchImages({ query: "dog" }))).resolves.toEqual({
      images: [fullImage],
      query: "server query",
      totalCount: 1,
    });
    await expect(client.send(getCurrentUser())).resolves.toMatchObject({
      uid: "uid",
    });
    await expect(
      client.send(getOEmbed({ url: "https://gyazo.com/abc123" })),
    ).resolves.toMatchObject({ provider_name: "Gyazo" });
  });

  it("rejects invalid client and command inputs", () => {
    expect(() => createGyazoClient({ accessToken: " " })).toThrow(TypeError);
    expect(() =>
      createGyazoClient({ accessToken: "token", timeoutMs: 0 }),
    ).toThrow(RangeError);
    expect(() =>
      createGyazoClient({ accessToken: "token", apiUrl: "relative" }),
    ).toThrow(TypeError);
    expect(() =>
      createGyazoClient({
        accessToken: "token",
        uploadUrl: "ftp://example.com",
      }),
    ).toThrow(TypeError);
    expect(() => getImage({ imageId: " " })).toThrow(TypeError);
    expect(() => listImages({ perPage: 101 })).toThrow(RangeError);
    expect(() => listImages({ page: 1.5 })).toThrow(RangeError);
    expect(() => searchImages({ query: "x".repeat(201) })).toThrow(RangeError);
    expect(() => searchImages({ query: "x", perPage: 0 })).toThrow(RangeError);
    expect(() => getOEmbed({ url: " " })).toThrow(TypeError);
    expect(() =>
      uploadImage({ image: {} as Blob, filename: "image.png" }),
    ).toThrow(TypeError);
    expect(() => uploadImage({ image: new Blob(), filename: " " })).toThrow(
      TypeError,
    );
    expect(() =>
      uploadImage({ image: new Blob(), filename: "image.png", createdAt: -1 }),
    ).toThrow(RangeError);
  });

  it("rejects foreign command origins before sending credentials", async () => {
    const client = createGyazoClient({
      accessToken: "token",
      handler: async () => {
        throw new Error("must not send");
      },
    });
    const error = await client
      .send({
        request: { method: "GET", url: "https://example.com" },
        parseData: () => undefined,
      } as never)
      .catch((value: unknown) => value);
    expect(isHttpCommandError(error) && error.code).toBe("TRANSPORT");
  });

  it("uses the shared fetch transport when no handler is supplied", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(json([image]));
    const client = createGyazoClient({ accessToken: "token" });
    await expect(client.send(listImages())).resolves.toMatchObject({
      images: [image],
    });
    expect(fetch).toHaveBeenCalledOnce();
    fetch.mockRestore();
  });

  it("turns malformed optional response fields into parse errors", async () => {
    const responses = [
      {},
      { ...image, permalink_url: 1 },
      { ...image, metadata: [] },
      { ...image, ocr: { locale: "en" } },
      { ...image, video_length: Number.POSITIVE_INFINITY },
    ];
    const client = createGyazoClient({
      accessToken: "token",
      handler: async () => ({ response: json(responses.shift()) }),
    });

    for (let index = 0; index < 5; index += 1) {
      const error = await client
        .send(getImage({ imageId: "id" }))
        .catch((value: unknown) => value);
      expect(isHttpCommandError(error) && error.code).toBe("PARSE");
    }
  });
});

function json(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(value), { ...init, headers });
}
