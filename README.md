# @mktbsh/gyazo-api

A type-safe, zero-dependency Gyazo API client for TypeScript and JavaScript.

- Node.js 20+ and modern browsers
- Web-standard `fetch`, `FormData`, and `Blob`
- Typed `Result` values for API, validation, timeout, and network errors
- Direct client methods and a backwards-compatible command API
- AbortSignal and configurable request timeouts

## Installation

```sh
pnpm add @mktbsh/gyazo-api
```

The package is ESM-only.

## Authentication

Create an access token from the [Gyazo API dashboard](https://gyazo.com/oauth/applications), then pass it to the client. Do not expose a personal access token in browser code distributed to other users.

```ts
import { createGyazoClient } from "@mktbsh/gyazo-api";

const accessToken = process.env.GYAZO_ACCESS_TOKEN;
if (!accessToken) throw new Error("GYAZO_ACCESS_TOKEN is required");

const gyazo = createGyazoClient({ accessToken });
```

An empty token, invalid timeout, or invalid endpoint URL throws `GyazoValidationError` while creating the client.

## Direct API

### List images

```ts
const result = await gyazo.images.list({ page: 1, perPage: 20 });

if (result.ok) {
  console.log(result.value.images);
  console.log(result.value.totalCount);
}
```

### Get an image

```ts
const result = await gyazo.images.get("IMAGE_ID");
```

### Upload an image

```ts
import { readFile } from "node:fs/promises";

const bytes = await readFile("screenshot.png");
const image = new Blob([bytes], { type: "image/png" });

const result = await gyazo.images.upload({
  image,
  filename: "screenshot.png",
  accessPolicy: "only_me",
  title: "CLI upload",
});

if (result.ok) console.log(result.value.permalink_url);
```

`createdAt` is optional and is only sent when explicitly provided.

### Delete an image

```ts
const result = await gyazo.images.delete("IMAGE_ID");
```

### Search images

```ts
const result = await gyazo.images.search({
  query: "architecture diagram",
  page: 1,
  per: 20,
});
```

Gyazo's Search API is available to Pro users. A non-Pro response is returned as a `GyazoAPIError` with `isProRequired === true`.

### Get the current user

```ts
const result = await gyazo.users.me();
```

### Get oEmbed data

```ts
const result = await gyazo.oEmbed.get({
  url: "https://gyazo.com/IMAGE_ID",
});
```

## Error handling

Every request method returns `GyazoResult<T, GyazoClientError>`.

```ts
import { GyazoAPIError } from "@mktbsh/gyazo-api";

const result = await gyazo.images.list();

if (!result.ok) {
  if (result.error instanceof GyazoAPIError) {
    console.error(result.error.status, result.error.message);

    if (result.error.isAuthenticationError) console.error("Invalid token");
    if (result.error.isProRequired) console.error("Gyazo Pro is required");
    if (result.error.isRateLimited) console.error("Rate limit exceeded");
  } else {
    console.error(result.error.kind, result.error.message);
  }
}
```

Possible `kind` values are `api`, `validation`, `timeout`, `abort`, `network`, `response`, and `unknown`.

## Cancellation and timeout

The default timeout is 10 seconds. Set `timeout: 0` to disable it.

```ts
const gyazo = createGyazoClient({
  accessToken,
  timeout: 5_000,
});

const controller = new AbortController();
const result = await gyazo.images.list({ signal: controller.signal });
controller.abort();
```

The timeout and caller-provided signal are both enforced.

## Command API

The existing command API remains available.

```ts
import {
  createGyazoClient,
  ListImagesCommand,
  UploadImageCommand,
} from "@mktbsh/gyazo-api";

const list = await gyazo.send(ListImagesCommand({ perPage: 20 }));
const upload = await gyazo.send(
  UploadImageCommand({ image, filename: "screenshot.png" }),
);
```

Available commands:

- `ListImagesCommand`
- `GetImageCommand`
- `UploadImageCommand`
- `DeleteImageCommand`
- `SearchImagesCommand`
- `GetCurrentUserCommand`
- `GetOEmbedCommand`

The old `imageID`, `per_page`, `access_policy`, `metadata_is_public`, `referer_url`, `created_at`, and `collection_id` input names remain supported but are deprecated. New code should use camelCase names.

## Development

```sh
bun install --frozen-lockfile
bun run check
```

`check` runs formatting and lint checks, strict TypeScript checks, coverage tests, the build, package metadata validation, and a packed-tarball consumer test.

## License

MIT
