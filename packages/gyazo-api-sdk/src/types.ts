export type GyazoImageType =
  | "gif"
  | "jpg"
  | "jpeg"
  | "mp4"
  | "png"
  | (string & {});

export type GyazoAccessPolicy = "anyone" | "only_me" | (string & {});

export type GyazoImageMetadata = Readonly<{
  app?: string | null;
  title?: string | null;
  url?: string | null;
  desc?: string | null;
  original_title?: string | null;
  original_url?: string | null;
}>;

export type GyazoImageOCR = Readonly<{
  locale: string;
  description: string;
}>;

export type GyazoImage = Readonly<{
  image_id: string;
  permalink_url: string | null;
  url?: string | null;
  thumb_url: string | null;
  type: GyazoImageType;
  created_at: string;
  access_policy?: GyazoAccessPolicy | null;
  alt_text?: string | null;
  metadata?: GyazoImageMetadata;
  ocr?: GyazoImageOCR;
  video_length?: number;
  mp4_url?: string;
}>;

export type GyazoUpload = Readonly<{
  image_id: string;
  permalink_url: string;
  thumb_url: string;
  url: string;
  type: GyazoImageType;
}>;

export type GyazoUser = Readonly<{
  email: string;
  name: string;
  profile_image: string;
  uid: string;
}>;

export type GyazoOEmbed = Readonly<{
  version: string;
  type: "photo" | (string & {});
  provider_name: string;
  provider_url: string;
  url: string;
  width: number;
  height: number;
}>;

export type ListImagesInput = Readonly<{
  page?: number;
  perPage?: number;
}>;

export type ListImagesOutput = Readonly<{
  images: ReadonlyArray<GyazoImage>;
  totalCount?: number;
  currentPage?: number;
  perPage?: number;
  userType?: string;
}>;

export type GetImageInput = Readonly<{ imageId: string }>;

export type UploadImageInput = Readonly<{
  image: Blob;
  filename: string;
  accessPolicy?: GyazoAccessPolicy;
  metadataIsPublic?: boolean;
  refererUrl?: string;
  app?: string;
  title?: string;
  desc?: string;
  createdAt?: number;
  collectionId?: string;
}>;

export type UploadImageBytesInput = Readonly<{
  image: Uint8Array;
  filename: string;
  accessPolicy?: GyazoAccessPolicy | undefined;
  metadataIsPublic?: boolean | undefined;
  refererUrl?: string | undefined;
  app?: string | undefined;
  title?: string | undefined;
  desc?: string | undefined;
  createdAt?: number | undefined;
  collectionId?: string | undefined;
}>;

export type DeleteImageInput = Readonly<{ imageId: string }>;

export type DeleteImageOutput = Readonly<{
  image_id: string;
  type: GyazoImageType;
}>;

export type SearchImagesInput = Readonly<{
  query: string;
  page?: number;
  perPage?: number;
}>;

export type SearchImagesOutput = Readonly<{
  images: ReadonlyArray<GyazoImage>;
  query: string;
  totalCount?: number;
}>;

export type GetOEmbedInput = Readonly<{ url: string }>;
