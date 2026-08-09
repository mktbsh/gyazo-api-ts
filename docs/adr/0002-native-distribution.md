---
title: Build gyazoctl native releases with scriptc
date: 2026-08-09T22:48:44+09:00
status: accepted
agent: OpenAI Codex GPT-5
amended_by: 0004-changesets-release.md
---

# Build gyazoctl native releases with scriptc

## Context

`gyazoctl` は npm の `npx` 経路に加え、Node.js を要求しない Homebrew Formula として配布する必要がある。native compiler には scriptc と Perry が候補となった。

Perry 0.5.1219 と 0.5.1220 は workspace package と `@hsblabs/http-command` を native module として code generation できたが、配布済み macOS arm64 stdlib が HTTP client symbols を解決できず link に失敗した。scriptc 0.0.23 は npm dependency を含む dynamic build と HTTP 実行に成功した。

## Decision

- `scriptc@0.0.23` を workspace dev dependency として固定する。
- npm 用 ESM は tsdown で作り、native executable は型情報を保つ `packages/gyazoctl/src/index.ts` から `scriptc --dynamic` で作る。
- scriptc が未対応の `node:util.parseArgs` は依存なしの parser に置き換える。
- upload は SDK の `uploadImageBytes` command が multipart body を `Uint8Array` で作り、FormData/Blob を持たない native runtime でも同じ scoped client と response validation を通す。
- GitHub-hosted macOS arm64/x64 runner で host-native build を行い、neutral basename の tarball と SHA-256 checksum を GitHub Release に載せる。
- release workflow が npm publish の成功後に GitHub Release を作り、その asset checksum から `mktbsh/homebrew-tap` の Formula を更新する。

## Consequences

npm 利用者は従来どおり `npx gyazoctl` を使える。Homebrew 利用者は Node.js なしで native binary を使える。dynamic binary は build host と architecture が一致する必要があるため、release は macOS arm64 と x64 を別々に作る。Perry は HTTP link failure が解消し、同じ runtime smoke を通せる時点まで採用を保留する。
