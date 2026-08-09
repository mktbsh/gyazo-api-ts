# gyazo-api-sdk

Gyazo API 用の pnpm workspace です。

- [`gyazo-api-sdk`](./packages/gyazo-api-sdk): `@hsblabs/http-command` ベースの TypeScript SDK
- [`gyazoctl`](./packages/gyazoctl): Gyazo API のコマンドラインクライアント

## Development

```sh
pnpm install
pnpm run check
pnpm run check:native
```

`check:native` は macOS 13 以降、Xcode Command Line Tools、CMake を必要とします。

## gyazoctl

Node.js がある環境では npm 版を直接実行できます。

```sh
npx gyazoctl --help
```

macOS では Node.js を必要としない native binary を Homebrew から導入できます。

```sh
brew install mktbsh/tap/gyazoctl
```

公開手順と必要な repository secrets は [`docs/releasing.md`](./docs/releasing.md) に記載しています。
