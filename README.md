# @mktbsh/gyazo-api

Modern, Type-Safe, Universal Gyazo API Client for TypeScript & JavaScript.

Node.js (v18+) とブラウザの両方で動作する、依存関係ゼロの Gyazo API クライアントです。 AWS SDK v3 のような関数型アーキテクチャを採用しており、Tree-shaking に対応しています。また、Rust ライクな Result 型による安全なエラーハンドリングを提供します。

## 特徴

- Universal: Node.js (v18+) とモダンブラウザの両方で動作（Web 標準 API を使用）。

- Zero Dependencies: axios や form-data などの外部依存パッケージは一切ありません。

- Functional API: クラスを使わない関数ベースの設計。AWS SDK v3 のように client.send(Command) スタイルで記述します。

- Result Type: try-catch 不要。戻り値の ok プロパティで成功/失敗を型安全に分岐できます。

## インストール

`npm`

```sh
npm install @mktbsh/gyazo-api
```

`npm`

```sh
npm install @mktbsh/gyazo-api
```

`yarn`

```sh
yarn add @mktbsh/gyazo-api
```

`pnpm`

```sh
pnpm add @mktbsh/gyazo-api
```

`bun`

```sh
bun add @mktbsh/gyazo-api
```

## クイックスタート

### 画像のアップロード

```ts
import { createGyazoClient, UploadImageCommand } from "@mktbsh/gyazo-api";

// 1. クライアントの作成
const client = createGyazoClient({
  accessToken: process.env.GYAZO_ACCESS_TOKEN,
});

async function main() {
  // Node.jsの場合: BufferなどをBlobに変換
  // ブラウザの場合: <input type="file"> の File オブジェクトをそのまま渡せます
  const blob = new Blob(["Hello Gyazo!"], { type: "text/plain" });

  // 2. コマンドの送信
  const result = await client.send(
    UploadImageCommand({
      image: blob,
      filename: "sample.png",
      title: "My Upload",
    })
  );

  // 3. Result型によるハンドリング
  if (result.ok) {
    console.log("Upload Success:", result.value.permalink_url);
  } else {
    console.error("Upload Failed:", result.error.message);
  }
}

main();
```

## エラーハンドリング (Result Pattern)

このライブラリは try-catch を強制しません。client.send() は常に Result<T, E> 型を返します。

```ts
import { createGyazoClient, ListImagesCommand } from "@mktbsh/gyazo-api";

const result = await client.send(ListImagesCommand());

if (result.ok) {
  // result.value は APIのレスポンスデータ (GyazoImage[])
  console.log(`Fetched ${result.value.length} images.`);
} else {
  // result.error は Error または GyazoApiError
  if (result.error instanceof GyazoApiError) {
    console.error(
      `API Error: ${result.error.status} ${result.error.statusText}`
    );
  } else {
    console.error("Network or Unknown Error:", result.error);
  }
}
```

## Configuration

タイムアウトを設定する

```ts
const client = createGyazoClient({
  accessToken: "YOUR_TOKEN",

  // タイムアウト (ミリ秒)
  timeout: 5000,
});
```

## API コマンド一覧

`UploadImageCommand`

画像をアップロードします。

```ts
await client.send(
  UploadImageCommand({
    image: Blob | File, // 必須
    filename: string, // 必須
    title: string,
    desc: string,
    referer_url: string,
    collection_id: string,
    created_at: number,
  })
);
```

`ListImagesCommand`

アップロードした画像の一覧を取得します。

```ts
await client.send(
  ListImagesCommand({
    page: number, // デフォルト: 1
    per_page: number, // デフォルト: 20 (Max 100)
  })
);
```

`DeleteImageCommand`

画像を削除します。

```ts
await client.send(DeleteImageCommand("IMAGE_ID"));
```

## 要件

- Node.js: v18.0.0 以上 (Global fetch / FormData / Blob 対応のため)
- Browser: Modern Browsers (Chrome, Firefox, Safari, Edge)

## License

MIT
