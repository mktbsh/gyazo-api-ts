---
title: Distribute gyazoctl through a tap-owned Homebrew Formula
date: 2026-08-10T22:22:15+09:00
status: accepted
agent: OpenAI Codex GPT-5
amends:
  - 0002-native-distribution.md
  - 0003-linux-native-distribution.md
amended_by:
  - 0006-maltmill-formula-management.md
---

# Distribute gyazoctl through a tap-owned Homebrew Formula

## Context

macOS利用者へ`gyazoctl`のnative binaryをHomebrewで配布する。`gyazo-api-sdk`のrelease workflowから`mktbsh/homebrew-tap`へ書き込む方式はcross-repository credentialを必要とする。現在のLinux binaryはglibc 2.38を要求し、Debian 12では実行できない。

## Decision

- `mktbsh/homebrew-tap`でCaskではなくFormulaとして配布する。
- 初回FormulaはmacOS Ventura以降のarm64/amd64を対象とし、Linuxは古いglibcとの互換性を確保してから追加する。
- tap側のscheduled workflowが毎日、`mktbsh/gyazo-api-sdk`の最新non-prereleaseを確認する。
- 新しいversionを検出した場合だけ、macOS archiveとchecksumを取得・検証し、Formulaを生成する。
- Formulaのaudit、install、testがすべて成功した後、tap自身の`GITHUB_TOKEN`で`main`へcommitする。
- `gyazo-api-sdk`のrelease workflowにはtap更新jobやcross-repository credentialを追加しない。

## Consequences

`brew install mktbsh/tap/gyazoctl`でDeveloper ID署名を要求せずに導入できる。GitHub ReleaseからHomebrewへの反映には最大1日程度の遅延を許容する。同期または検証に失敗した場合は既存Formulaを維持し、binaryの問題はassetを置換せず新しいpatch releaseで修正する。
