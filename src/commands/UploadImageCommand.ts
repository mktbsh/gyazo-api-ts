import { GyazoCommand } from "../command";
import { ensureSuccess } from "../utils";

export interface UploadImageInput {
  image: Blob;
  filename: string;
  /**
   * @default "anyone"
   */
  access_policy?: "anyone" | "only_me";
  /**
   * URLやタイトルなどのメタデータを公開するか否かの真偽値の文字列
   */
  metadata_is_public?: boolean;
  /**
   * キャプチャをしたサイトのURL
   */
  referer_url?: string;
  /**
   * キャプチャをしたアプリケーション名
   */
  app?: string;
  /**
   * キャプチャをしたサイトのタイトル
   */
  title?: string;
  /**
   * 任意のコメント
   */
  desc?: string;
  /**
   * 画像の作られた日時（Unix time）
   * @default Date.now() / 1000
   */
  created_at?: number;
  /**
   * ユーザーが所有している/参加しているコレクションにのみ追加できます
   */
  collection_id?: string;
}

export interface UploadImageOutput {
  image_id: string;
  permalink_url: string;
  thumb_url: string;
  url: string;
  type: string;
}

export const UploadImageCommand = (
  input: UploadImageInput
): GyazoCommand<UploadImageOutput> => {
  return async (context) => {
    const url = context.createUploadURL("/api/upload");

    const formData = new FormData();
    formData.set("imagedata", input.image, input.filename);
    formData.set("access_policy", input.access_policy || "anyone");
    formData.set(
      "created_at",
      Math.floor(input.created_at || Date.now() / 1000).toString()
    );
    if (input.metadata_is_public !== undefined) {
      formData.set("metadata_is_public", String(input.metadata_is_public));
    }
    if (input.referer_url) formData.set("referer_url", input.referer_url);
    if (input.app) formData.set("app", input.app);
    if (input.title) formData.set("title", input.title);
    if (input.desc) formData.set("desc", input.desc);
    if (input.collection_id) formData.set("collection_id", input.collection_id);

    const response = await context.fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${context.accessToken}`,
      },
    });
    const { data } = await ensureSuccess<UploadImageOutput>(response);

    return data;
  };
};
