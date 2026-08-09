---
title: gyazo-api-sdk rebuild specification
date: 2026-08-09T21:56:53+09:00
status: accepted
---

# gyazo-api-sdk rebuild specification

## Goal

未公開の `@mktbsh/gyazo-api` を `gyazo-api-sdk` へ改名し、`@hsblabs/http-command` の scoped command protocol を使う pnpm workspace として再構築する。Phase 2 で `gyazoctl` を同じ workspace に追加し、Phase 3 で npm と Homebrew の配布経路を作る。

## Phase 1: SDK

- 公開パッケージ名は `gyazo-api-sdk`、初期バージョンは `0.1.0` とする。
- `packages/gyazo-api-sdk` に配置する。
- `@hsblabs/http-command` の `Client<Scope>`、`defineCommand`、`defineJsonCommand`、`bearerAuth`、標準エラーを利用する。
- 旧パッケージは未公開のため、旧 `Result` API、直接メソッド、deprecated input 名の互換層は設けない。
- list/get/upload/delete/search/current-user/oEmbed の各 Gyazo API を command factory として公開する。
- 入力とサービス応答を SDK 境界で検証する。

## Phase 2: CLI

- 公開パッケージ名は `gyazoctl`、予約済み `0.0.1` の次となる `0.1.0` とする。
- `packages/gyazoctl` に配置する。
- `GYAZO_ACCESS_TOKEN` で認証し、`list`、`get`、`upload`、`delete`、`search`、`me`、`oembed` を提供する。
- 成功結果は JSON で標準出力へ、エラーは標準エラー出力へ出し、失敗時は終了コード 1 とする。
- 引数解析は依存を追加せず、Node.js と native binary の両方で同じ parser を使う。

## Phase 3: native distribution

- `scriptc --dynamic` で `gyazoctl` の TypeScript source から macOS/Linux arm64/x64 native executable を作る。
- native executable は Node.js を要求せず、npm CLI と同じ command、環境変数、stdout/stderr、終了コードを保つ。
- GitHub Release asset は `gyazoctl-{darwin,linux}-{arm64,x64}.tar.gz` とし、各 archive 内の executable 名は `gyazoctl` に統一する。
- `install.sh` は OS/architecture に対応する GitHub Release asset と checksum を取得・検証し、`~/.local/bin` または `GYAZOCTL_INSTALL_DIR` へ native executable を導入する。
- npm では `gyazo-api-sdk` と `gyazoctl` を公開し、`npx gyazoctl` を提供する。
- `mktbsh/homebrew-tap` の `Formula/gyazoctl.rb` を release workflow から更新し、`brew install mktbsh/tap/gyazoctl` を提供する。
- tag、両 package version、native binary version は一致させる。
- npm Trusted Publisher または `NPM_TOKEN` と、tap 更新用 `HOMEBREW_TAP_TOKEN` を公開前提とする。

## Acceptance

- `pnpm install --frozen-lockfile` が成功する。
- `pnpm run check` が成功する。
- `pnpm run check:native` が成功し、scriptc coverage に blocker が残らない。
- 両パッケージの tarball が作成でき、`publint` と `attw` を通る。
- npm tarball の `npx gyazoctl` と native binary の help、version、引数検証、削除 safety check が成功する。
- release workflow が 2 OS/2 architecture の archive/checksum、npm publish、GitHub Release、Homebrew Formula 更新を順に実行する。
- macOS/Linux arm64/x64 の各 release job で `install.sh` による導入と binary version の一致を検証する。

公開用 workflow と Formula template の作成は範囲内とする。tag 作成、push、npm/GitHub/Homebrew への実公開は別の明示操作とする。
