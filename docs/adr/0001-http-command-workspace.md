---
title: Use http-command in a pnpm workspace
date: 2026-08-09T21:56:53+09:00
status: accepted
agent: OpenAI Codex GPT-5
---

# Use http-command in a pnpm workspace

## Context

旧 `@mktbsh/gyazo-api` は npm 未公開で、独自の command runtime、fetch wrapper、Result、エラー階層を持っていた。再構築では `@hsblabs/http-command` の利用と、後続の `gyazoctl` 追加が求められている。

## Decision

- repository root を pnpm workspace とし、SDK と CLI を `packages/` に分ける。
- SDK は service 固有の scope を持つ `Client` と command factory を公開する。
- transport、timeout、middleware、Bearer 認証、標準 HTTP エラーは `@hsblabs/http-command` に委譲する。
- Gyazo 固有の URL 選択、入力制約、応答 parser だけを SDK が所有する。
- 未公開 API の互換層は作らない。

## Consequences

SDK 内の汎用 HTTP runtime を削除できる。利用者は値を直接返す `client.send(command)` と、失敗時の `HttpCommandError` を扱う。upload host の選択は client resolver に集約する。
