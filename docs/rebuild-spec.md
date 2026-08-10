---
title: gyazo-api-sdk rebuild specification
date: 2026-08-09T21:56:53+09:00
updated: 2026-08-10T22:53:17+09:00
status: accepted
---

# gyazo-api-sdk rebuild specification

## Goal

未公開の `@mktbsh/gyazo-api` を `gyazo-api-sdk` へ改名し、`@hsblabs/http-command` の scoped command protocol を使う pnpm workspace として再構築する。Phase 2 で `gyazoctl` を同じ workspace に追加し、Phase 3 で npm と GitHub Releases の配布経路を作る。

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

## Phase 3: Changesets release

- `scriptc --dynamic` で `gyazoctl` の TypeScript source から macOS/Linux arm64/amd64 native executable を作る。
- native executable は Node.js を要求せず、npm CLI と同じ command、環境変数、stdout/stderr、終了コードを保つ。
- GitHub Release asset は `gyazoctl-{darwin,linux}-{arm64,amd64}.tar.gz` とし、各 archive 内の executable 名は `gyazoctl` に統一する。
- Changesets fixed group で `gyazo-api-sdk` と `gyazoctl` を同時に versioning し、npm へ公開する。
- npm publish は GitHub Actions Trusted Publishing の OIDC だけを使う。
- 両 package の npm publish 後、同じ version の `v*` GitHub Release に4 platformのarchiveとchecksumを添付する。
- tag、両 package version、native binary version は一致させる。
- install script と Homebrew Formula は `gyazo-api-sdk` release workflow の scope 外とする。

## Phase 4: Convenience distribution

- repository rootの`install.sh`でmacOS/Linux arm64/amd64 binaryを`~/.local/bin`へ導入する。
- macOS Ventura以降では`mktbsh/homebrew-tap`のFormulaとしてarm64/amd64 binaryを配布する。
- tap側のscheduled workflowがmaltmillで最新non-prereleaseを検知し、Formulaをaudit、install、testしてから更新する。
- `gyazo-api-sdk`からtapへ書き込むcredentialは保持しない。
- Linux Formulaはglibc 2.38未満との互換性を確保してから追加する。

## Acceptance

- `pnpm install --frozen-lockfile` が成功する。
- `pnpm run check` が成功する。
- `pnpm run check:native` が成功し、scriptc coverage に blocker が残らない。
- 両パッケージの tarball が作成でき、`publint` と `attw` を通る。
- npm tarball の `npx gyazoctl` と native binary の help、version、引数検証、削除 safety check が成功する。
- Changesets が両 package を同じ version に更新し、SDK、CLI の順に OIDC publish する。
- release workflow が macOS/Linux arm64/amd64 のarchive/checksumを同じ `v*` GitHub Releaseへ添付する。
- 途中失敗の再実行では公開済みnpm versionを再publishせず、不足するRelease assetを補完する。
- `install.sh`がchecksumとversionを検証してnative binaryを導入する。
- tap側workflowがFormulaを生成し、`brew audit`、`brew install`、`brew test`に成功する。

公開用 workflow の作成は範囲内とする。push、npm、GitHub Releases への実公開は別の明示操作とする。
