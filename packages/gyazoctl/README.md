# gyazoctl

Gyazo API のコマンドラインクライアントです。npm 版は Node.js 20 以降、native 版は macOS 13 以降または Linux で動作します。

## Installation

npm:

```sh
npx gyazoctl --help
pnpm add --global gyazoctl
```

Node.jsを必要としないmacOS/Linux arm64/x64 binaryは[GitHub Releases](https://github.com/mktbsh/gyazo-api-sdk/releases)で配布します。

## Authentication

Gyazo API dashboard で access token を作り、環境変数に設定します。

```sh
export GYAZO_ACCESS_TOKEN="..."
```

token をコマンドライン引数では受け取りません。

## Usage

```sh
gyazoctl list --per-page 20
gyazoctl get IMAGE_ID
gyazoctl upload screenshot.png --title "Screenshot"
gyazoctl search "architecture diagram"
gyazoctl delete IMAGE_ID
gyazoctl me
gyazoctl oembed https://gyazo.com/IMAGE_ID
```

各コマンドの詳細は `gyazoctl <command> --help` で確認できます。成功結果は JSON として標準出力へ出力します。
