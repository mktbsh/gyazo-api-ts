---
title: Release gyazo-api-sdk and gyazoctl
date: 2026-08-09T22:48:44+09:00
---

# Release gyazo-api-sdk and gyazoctl

## One-time setup

1. npm の `gyazo-api-sdk` と `gyazoctl` に GitHub Actions Trusted Publisher を設定する。repository は `mktbsh/gyazo-api-sdk`、workflow filename は `release.yml` とする。
2. 初回 publish で Trusted Publisher を設定できない package には、repository secret `NPM_TOKEN` を設定する。Trusted Publisher へ移行後は削除できる。
3. `mktbsh/homebrew-tap` へ Contents read/write できる fine-grained token を repository secret `HOMEBREW_TAP_TOKEN` に設定する。

## Release

1. `packages/gyazo-api-sdk/package.json`、`packages/gyazoctl/package.json`、CLI の `VERSION` を同じ version に更新する。
2. `pnpm install --frozen-lockfile`、`pnpm run check`、`pnpm run check:native` を実行する。
3. 変更を commit/push し、同じ version の `v*` tag を push する。

`release.yml` は検証後に次の順で公開する。

1. macOS arm64/x64 native binary を build し、binary version と tag を照合する。
2. neutral basename `gyazoctl` を architecture 別 tarball にし、SHA-256 checksum を作る。
3. `gyazo-api-sdk`、`gyazoctl` を npm へ provenance 付きで公開する。
4. tarball と checksum を GitHub Release へ公開する。
5. checksum から `Formula/gyazoctl.rb` を生成し、audit/install/version test 後に `mktbsh/homebrew-tap` へ push する。

## Failure and rollback

Workflow は npm publish が成功するまで GitHub Release と Formula を更新しない。途中失敗は同じ tag の workflow rerun で再開でき、既に存在する npm version は skip される。

公開後に native artifact の問題が判明した場合は GitHub Release を pre-release として明示し、Homebrew Formula を直前の正常 version と checksum へ戻す。npm package は削除せず `npm deprecate` で問題 version を案内し、修正版を新しい version として公開する。
