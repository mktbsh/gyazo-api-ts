export interface GyazoImage {
  image_id: string;
  permalink_url: string;
  url: string;
  thumb_url: string | null;
  type: "jpg" | "png" | (string & {});
  access_policy: string | null;
  alt_text: string;
  created_at: string;
  metadata?: GyazoImageMetadata;
  ocr?: GyazoImageOCR;
}

export interface GyazoImageMetadata {
  app: string | null;
  title: string | null;
  url: string | null;
  desc: string | null;
  original_title: string | null;
  original_url: string | null;
}

export interface GyazoImageOCR {
  locale: string;
  description: string;
}
