import type { GyazoCommand, GyazoRequestOptions } from "../command";
import type { GyazoAccessPolicy, GyazoUpload } from "../types";
import { assertNonEmpty, ensureSuccess } from "../utils";

export interface UploadImageInput extends GyazoRequestOptions {
  image: Blob;
  filename: string;
  accessPolicy?: GyazoAccessPolicy;
  /** @deprecated Use accessPolicy. */
  access_policy?: GyazoAccessPolicy;
  metadataIsPublic?: boolean;
  /** @deprecated Use metadataIsPublic. */
  metadata_is_public?: boolean;
  refererUrl?: string;
  /** @deprecated Use refererUrl. */
  referer_url?: string;
  app?: string;
  title?: string;
  desc?: string;
  createdAt?: number;
  /** @deprecated Use createdAt. */
  created_at?: number;
  collectionId?: string;
  /** @deprecated Use collectionId. */
  collection_id?: string;
}

export type UploadImageOutput = GyazoUpload;

export const UploadImageCommand = (
  input: UploadImageInput,
): GyazoCommand<UploadImageOutput> => {
  return async (context) => {
    assertNonEmpty(input.filename, "filename");
    const url = context.createUploadURL("/api/upload");
    const formData = new FormData();
    formData.set("imagedata", input.image, input.filename);

    setIfDefined(
      formData,
      "access_policy",
      input.accessPolicy ?? input.access_policy,
    );
    const metadataIsPublic = input.metadataIsPublic ?? input.metadata_is_public;
    if (metadataIsPublic !== undefined) {
      formData.set("metadata_is_public", String(metadataIsPublic));
    }
    setIfDefined(
      formData,
      "referer_url",
      input.refererUrl ?? input.referer_url,
    );
    setIfDefined(formData, "app", input.app);
    setIfDefined(formData, "title", input.title);
    setIfDefined(formData, "desc", input.desc);
    setIfDefined(
      formData,
      "collection_id",
      input.collectionId ?? input.collection_id,
    );

    const createdAt = input.createdAt ?? input.created_at;
    if (createdAt !== undefined) {
      formData.set("created_at", Math.floor(createdAt).toString());
    }

    const init: RequestInit = { method: "POST", body: formData };
    if (input.signal) init.signal = input.signal;
    const response = await context.request(url, init);
    const { data } = await ensureSuccess<UploadImageOutput>(response);
    return data;
  };
};

function setIfDefined(
  formData: FormData,
  name: string,
  value: string | undefined,
): void {
  if (value !== undefined) formData.set(name, value);
}
