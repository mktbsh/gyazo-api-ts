# gyazo-api-sdk

`@hsblabs/http-command` を使った Gyazo API の ESM-only TypeScript SDK です。Node.js 20 以降と、Fetch API を備えたモダンブラウザで動作します。

## Installation

```sh
pnpm add gyazo-api-sdk
```

## Usage

```ts
import {
  createGyazoClient,
  listImages,
  uploadImage,
  uploadImageBytes,
} from "gyazo-api-sdk";

const client = createGyazoClient({
  accessToken: process.env.GYAZO_ACCESS_TOKEN!,
});

const images = await client.send(listImages({ perPage: 20 }));

const uploaded = await client.send(
  uploadImage({
    image: new Blob(["image"]),
    filename: "image.png",
  }),
);

const uploadedBytes = await client.send(
  uploadImageBytes({
    image: new TextEncoder().encode("image"),
    filename: "image.png",
  }),
);
```

利用できる command factory は `listImages`、`getImage`、`uploadImage`、`uploadImageBytes`、`deleteImage`、`searchImages`、`getCurrentUser`、`getOEmbed` です。`uploadImageBytes` は FormData/Blob を持たない native runtime 向けに、同じ upload API を `Uint8Array` から呼び出します。

リクエスト失敗時は `@hsblabs/http-command` の `HttpCommandError` が throw されます。`isHttpCommandError` もこのパッケージから利用できます。
