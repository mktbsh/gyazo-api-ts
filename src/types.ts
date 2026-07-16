export type GyazoImageType =
  | "gif"
  | "jpg"
  | "jpeg"
  | "mp4"
  | "png"
  | (string & {});

export type GyazoAccessPolicy = "anyone" | "only_me" | (string & {});

export interface GyazoImage {
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
}

export interface GyazoImageMetadata {
  app?: string | null;
  title?: string | null;
  url?: string | null;
  desc?: string | null;
  original_title?: string | null;
  original_url?: string | null;
}

export interface GyazoImageOCR {
  locale: string;
  description: string;
}

export interface GyazoUpload {
  image_id: string;
  permalink_url: string;
  thumb_url: string;
  url: string;
  type: GyazoImageType;
}

export interface GyazoUser {
  email: string;
  name: string;
  profile_image: string;
  uid: string;
}

export interface GyazoOEmbed {
  version: string;
  type: "photo" | (string & {});
  provider_name: string;
  provider_url: string;
  url: string;
  width: number;
  height: number;
}
