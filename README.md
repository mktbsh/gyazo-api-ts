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

`check:native` は macOS 13 以降または Linux、Clang、CMake を必要とします。

## gyazoctl

Node.js がある環境では npm 版を直接実行できます。

```sh
npx gyazoctl --help
```

Node.jsを必要としないmacOS binaryはHomebrewで導入できます。

```sh
brew install mktbsh/tap/gyazoctl
```

macOS/Linux arm64/x64 binaryはinstall scriptでも導入できます。

```sh
curl -fsSL https://raw.githubusercontent.com/mktbsh/gyazo-api-sdk/main/install.sh | sh
```

既定の導入先は `~/.local/bin` です。version は `GYAZOCTL_VERSION`、導入先は `GYAZOCTL_INSTALL_DIR` で指定できます。

Changesetsによる公開手順は[`docs/releasing.md`](./docs/releasing.md)に記載しています。
