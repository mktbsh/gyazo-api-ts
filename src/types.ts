export interface GyazoImage {
  image_id: string;
  permalink_url: string | null;
  thumb_url: string | null;
  type: string;
  created_at: string;
  metadata?: GyazoImageMetadata;
  ocr?: GyazoImageOCR;
}

export interface GyazoImageMetadata {
  app: string | null;
  title: string | null;
  url: string | null;
  desc: string | null;
}

export interface GyazoImageOCR {
  locale: string;
  description: string;
}
