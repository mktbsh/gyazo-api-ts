import type {
  DeleteImageOutput,
  GyazoImage,
  GyazoImageMetadata,
  GyazoImageOCR,
  GyazoOEmbed,
  GyazoUpload,
  GyazoUser,
  SearchImagesOutput,
} from "./types";

type UnknownRecord = Record<string, unknown>;

export function parseImages(value: unknown): ReadonlyArray<GyazoImage> {
  if (!Array.isArray(value)) throw new TypeError("Expected an image array");
  return value.map(parseImage);
}

export function parseImage(value: unknown): GyazoImage {
  const record = asRecord(value, "image");
  return {
    image_id: string(record, "image_id"),
    permalink_url: nullableString(record, "permalink_url"),
    thumb_url: nullableString(record, "thumb_url"),
    type: string(record, "type"),
    created_at: string(record, "created_at"),
    ...optional(record, "url", nullableString),
    ...optional(record, "access_policy", nullableString),
    ...optional(record, "alt_text", nullableString),
    ...optional(record, "metadata", parseMetadata),
    ...optional(record, "ocr", parseOCR),
    ...optional(record, "video_length", number),
    ...optional(record, "mp4_url", string),
  };
}

export function parseUpload(value: unknown): GyazoUpload {
  const record = asRecord(value, "upload");
  return {
    image_id: string(record, "image_id"),
    permalink_url: string(record, "permalink_url"),
    thumb_url: string(record, "thumb_url"),
    url: string(record, "url"),
    type: string(record, "type"),
  };
}

export function parseDelete(value: unknown): DeleteImageOutput {
  const record = asRecord(value, "deleted image");
  return {
    image_id: string(record, "image_id"),
    type: string(record, "type"),
  };
}

export function parseUser(value: unknown): GyazoUser {
  const record = asRecord(
    asRecord(value, "current user response").user,
    "user",
  );
  return {
    email: string(record, "email"),
    name: string(record, "name"),
    profile_image: string(record, "profile_image"),
    uid: string(record, "uid"),
  };
}

export function parseOEmbed(value: unknown): GyazoOEmbed {
  const record = asRecord(value, "oEmbed response");
  return {
    version: string(record, "version"),
    type: string(record, "type"),
    provider_name: string(record, "provider_name"),
    provider_url: string(record, "provider_url"),
    url: string(record, "url"),
    width: number(record, "width"),
    height: number(record, "height"),
  };
}

export function parseSearch(
  value: unknown,
  fallbackQuery: string,
): SearchImagesOutput {
  if (Array.isArray(value))
    return { images: value.map(parseImage), query: fallbackQuery };

  const record = asRecord(value, "search response");
  return {
    images: parseImages(record.captures),
    query: record.query === undefined ? fallbackQuery : string(record, "query"),
    ...optional(record, "number_of_captures", number, "totalCount"),
  };
}

function parseMetadata(parent: UnknownRecord, key: string): GyazoImageMetadata {
  const record = asRecord(parent[key], "image metadata");
  return {
    ...optional(record, "app", nullableString),
    ...optional(record, "title", nullableString),
    ...optional(record, "url", nullableString),
    ...optional(record, "desc", nullableString),
    ...optional(record, "original_title", nullableString),
    ...optional(record, "original_url", nullableString),
  };
}

function parseOCR(parent: UnknownRecord, key: string): GyazoImageOCR {
  const record = asRecord(parent[key], "image OCR");
  return {
    locale: string(record, "locale"),
    description: string(record, "description"),
  };
}

function asRecord(value: unknown, name: string): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`Expected ${name} to be an object`);
  }
  return value as UnknownRecord;
}

function string(record: UnknownRecord, key: string): string {
  const value = record[key];
  if (typeof value !== "string")
    throw new TypeError(`Expected ${key} to be a string`);
  return value;
}

function nullableString(record: UnknownRecord, key: string): string | null {
  const value = record[key];
  if (value !== null && typeof value !== "string") {
    throw new TypeError(`Expected ${key} to be a string or null`);
  }
  return value;
}

function number(record: UnknownRecord, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`Expected ${key} to be a finite number`);
  }
  return value;
}

function optional<T>(
  record: UnknownRecord,
  key: string,
  parse: (record: UnknownRecord, key: string) => T,
  outputKey = key,
): Record<string, T> {
  return record[key] === undefined ? {} : { [outputKey]: parse(record, key) };
}
