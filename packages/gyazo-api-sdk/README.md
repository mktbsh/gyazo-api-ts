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
```

利用できる command factory は `listImages`、`getImage`、`uploadImage`、`deleteImage`、`searchImages`、`getCurrentUser`、`getOEmbed` です。

リクエスト失敗時は `@hsblabs/http-command` の `HttpCommandError` が throw されます。`isHttpCommandError` もこのパッケージから利用できます。
