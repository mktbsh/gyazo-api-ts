---
title: Release fixed package versions and native binaries with Changesets
date: 2026-08-10T08:37:18+09:00
status: accepted
agent: OpenAI Codex GPT-5
amends:
  - 0002-native-distribution.md
  - 0003-linux-native-distribution.md
---

# Release fixed package versions and native binaries with Changesets

## Context

`gyazo-api-sdk`、`gyazoctl`、4 platformのnative binaryを一つのversionとして公開する必要がある。従来のtag起点workflowはpackage versionの更新を手作業に委ね、npm、GitHub Releases、Homebrewを一つのjob graphへ結合していた。

## Decision

- Changesets fixed groupで`gyazo-api-sdk`と`gyazoctl`を必ず同じversionへ更新する。
- Changesets Actionがversion PRを作り、merge後に両packageをnpm Trusted PublishingのOIDCで公開する。
- `changeset version`後にCLI sourceのversion定数をpackage versionへ同期する。
- Changesetsのpackage tagとは別に、同じcommitへ`vX.Y.Z` tagを作り、単一GitHub Releaseへ4 platformのarchiveとchecksumを添付する。
- npm上の両versionと既存Release assetを確認し、再実行時は未完了のbinary releaseだけを再開する。
- Homebrew Formulaとinstall scriptはrelease scopeから外す。

## Consequences

一つのchangesetが両npm packageとnative binaryのrelease versionを決める。Gitにはpackageごとの`name@version` tagと配布単位の`vX.Y.Z` tagが残る。npm package record作成とTrusted Publisher設定は初回release前のowner操作として別に行う。
