---
title: Release gyazo-api-sdk and gyazoctl
date: 2026-08-09T22:48:44+09:00
updated: 2026-08-10T08:37:18+09:00
---

# Release gyazo-api-sdk and gyazoctl

## One-time setup

1. npm の `gyazo-api-sdk` と `gyazoctl` に GitHub Actions Trusted Publisher を設定する。repository は `mktbsh/gyazo-api-sdk`、workflow filename は `release.yml` とする。
2. npm に未登録の `gyazo-api-sdk` は `0.1.0` より低いversionでpackage recordを作り、Trusted Publisherを設定する。初回登録はownerの2FAを使う一度限りの操作とし、GitHub Actionsへnpm tokenは保存しない。
3. 両packageのTrusted Publisher設定後、repository variable `NPM_TRUSTED_PUBLISHING_ENABLED`を`true`にする。

## Release

初回の`0.1.0` releaseだけは、両packageの`0.0.1` recordとTrusted Publisherを準備した後、changesetがない状態で`main`へpushする。Changesets Actionが現在の未公開versionを直接publishする。

以後のreleaseは次の手順で行う。

1. 公開対象の変更に `pnpm changeset` でchangesetを追加する。
2. pull requestを`main`へmergeする。
3. Release workflowが作成または更新する`chore: release packages` pull requestを確認してmergeする。

`release.yml` はversion pull requestのmerge後に次の順で公開する。

1. Changesets fixed groupが両packageとCLI sourceを同じversionへ更新する。
2. `gyazo-api-sdk`、`gyazoctl`をnpm Trusted PublishingのOIDCで公開する。
3. macOS/Linux arm64/x64 native binaryを各platformのrunnerでbuildする。
4. `gyazoctl-{darwin,linux}-{arm64,x64}.tar.gz`とchecksumを`v*` GitHub Releaseへ公開する。

## Failure and rollback

Workflowは両npm packageのversionを確認できるまでnative buildを開始しない。再実行時は公開済みnpm versionを再publishせず、8個のRelease assetが揃っていなければbinary buildから再開する。

公開後に問題が判明した場合はnpm packageやassetを置換せず、`npm deprecate`で案内して修正版を新しいversionで公開する。
