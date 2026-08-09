import {
  defineCommand,
  defineJsonCommand,
  encodePathSegment,
} from "@hsblabs/http-command";
import type { GyazoCommand, GyazoScope } from "./client";
import {
  parseDelete,
  parseImage,
  parseImages,
  parseOEmbed,
  parseSearch,
  parseUpload,
  parseUser,
} from "./parsers";
import type {
  DeleteImageInput,
  DeleteImageOutput,
  GetImageInput,
  GetOEmbedInput,
  GyazoImage,
  GyazoOEmbed,
  GyazoUpload,
  GyazoUser,
  ListImagesInput,
  ListImagesOutput,
  SearchImagesInput,
  SearchImagesOutput,
  UploadImageInput,
} from "./types";

const defineGyazoCommand = defineCommand<GyazoScope>();
const defineGyazoJsonCommand = defineJsonCommand<GyazoScope>();

const createListImagesCommand = defineGyazoCommand<
  ListImagesInput,
  ListImagesOutput
>({
  build: (input) => {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    assertPage(page);
    assertPerPage(perPage);
    return {
      method: "GET",
      url: "/api/images",
      query: { page, per_page: perPage },
    };
  },
  parseData: async (response) => {
    const images = parseImages(await response.json());
    const totalCount = integerHeader(response.headers, "x-total-count");
    const currentPage = integerHeader(response.headers, "x-current-page");
    const perPage = integerHeader(response.headers, "x-per-page");
    const userType = response.headers.get("x-user-type") ?? undefined;
    return {
      images,
      ...(totalCount === undefined ? {} : { totalCount }),
      ...(currentPage === undefined ? {} : { currentPage }),
      ...(perPage === undefined ? {} : { perPage }),
      ...(userType === undefined ? {} : { userType }),
    };
  },
});

const createGetImageCommand = defineGyazoJsonCommand<GetImageInput, GyazoImage>(
  {
    build: ({ imageId }) => ({
      method: "GET",
      url: `/api/images/${encodePathSegment(nonEmpty(imageId, "imageId"))}`,
    }),
    transform: parseImage,
  },
);

const createUploadImageCommand = defineGyazoJsonCommand<
  UploadImageInput,
  GyazoUpload
>({
  build: (input) => ({
    method: "POST",
    url: "/api/upload",
    body: uploadBody(input),
  }),
  transform: parseUpload,
});

const createDeleteImageCommand = defineGyazoJsonCommand<
  DeleteImageInput,
  DeleteImageOutput
>({
  build: ({ imageId }) => ({
    method: "DELETE",
    url: `/api/images/${encodePathSegment(nonEmpty(imageId, "imageId"))}`,
  }),
  transform: parseDelete,
});

const createCurrentUserCommand = defineGyazoJsonCommand<void, GyazoUser>({
  build: () => ({ method: "GET", url: "/api/users/me" }),
  transform: parseUser,
});

const createOEmbedCommand = defineGyazoJsonCommand<GetOEmbedInput, GyazoOEmbed>(
  {
    build: ({ url }) => ({
      method: "GET",
      url: "/api/oembed",
      query: { url: nonEmpty(url, "url") },
    }),
    transform: parseOEmbed,
  },
);

export const listImages: (
  input?: ListImagesInput,
) => GyazoCommand<ListImagesOutput> = (input = {}) =>
  createListImagesCommand(input);

export const getImage: (input: GetImageInput) => GyazoCommand<GyazoImage> = (
  input,
) => createGetImageCommand(input);

export const uploadImage: (
  input: UploadImageInput,
) => GyazoCommand<GyazoUpload> = (input) => createUploadImageCommand(input);

export const deleteImage: (
  input: DeleteImageInput,
) => GyazoCommand<DeleteImageOutput> = (input) =>
  createDeleteImageCommand(input);

export const searchImages: (
  input: SearchImagesInput,
) => GyazoCommand<SearchImagesOutput> = (input) => {
  const query = nonEmpty(input.query, "query");
  if (query.length > 200) {
    throw new RangeError("query must be 200 characters or fewer");
  }
  const page = input.page ?? 1;
  const perPage = input.perPage ?? 20;
  assertPage(page);
  assertPerPage(perPage);

  return defineGyazoJsonCommand<void, SearchImagesOutput>({
    build: () => ({
      method: "GET",
      url: "/api/search",
      query: { query, page, per: perPage },
    }),
    transform: (value) => parseSearch(value, query),
  })();
};

export const getCurrentUser: () => GyazoCommand<GyazoUser> = () =>
  createCurrentUserCommand();

export const getOEmbed: (input: GetOEmbedInput) => GyazoCommand<GyazoOEmbed> = (
  input,
) => createOEmbedCommand(input);

function uploadBody(input: UploadImageInput): FormData {
  if (!(input.image instanceof Blob))
    throw new TypeError("image must be a Blob");
  const form = new FormData();
  form.set("imagedata", input.image, nonEmpty(input.filename, "filename"));
  set(form, "access_policy", input.accessPolicy);
  set(form, "metadata_is_public", input.metadataIsPublic);
  set(form, "referer_url", input.refererUrl);
  set(form, "app", input.app);
  set(form, "title", input.title);
  set(form, "desc", input.desc);
  set(form, "collection_id", input.collectionId);
  if (input.createdAt !== undefined) {
    if (!Number.isInteger(input.createdAt) || input.createdAt < 0) {
      throw new RangeError("createdAt must be a non-negative integer");
    }
    form.set("created_at", String(input.createdAt));
  }
  return form;
}

function set(
  form: FormData,
  name: string,
  value: string | boolean | undefined,
): void {
  if (value !== undefined) form.set(name, String(value));
}

function nonEmpty(value: string, name: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${name} must not be empty`);
  return normalized;
}

function assertPage(value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError("page must be a positive integer");
  }
}

function assertPerPage(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new RangeError("perPage must be an integer between 1 and 100");
  }
}

function integerHeader(headers: Headers, name: string): number | undefined {
  const raw = headers.get(name);
  if (raw === null) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) ? value : undefined;
}
