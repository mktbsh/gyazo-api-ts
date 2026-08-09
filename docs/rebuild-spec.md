---
title: gyazo-api-sdk rebuild specification
date: 2026-08-09T21:56:53+09:00
status: accepted
---

# gyazo-api-sdk rebuild specification

## Goal

未公開の `@mktbsh/gyazo-api` を `gyazo-api-sdk` へ改名し、`@hsblabs/http-command` の scoped command protocol を使う pnpm workspace として再構築する。Phase 2 で `gyazoctl` を同じ workspace に追加する。

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
- 引数解析には Node.js 標準の `parseArgs` を使い、CLI フレームワークは追加しない。

## Acceptance

- `pnpm install --frozen-lockfile` が成功する。
- `pnpm run check` が成功する。
- 両パッケージの tarball が作成でき、`publint` と `attw` を通る。
- `gyazoctl --help` とビルド済み CLI の最小実行確認が成功する。

公開、push、PR 作成はこの再構築の範囲外とする。
