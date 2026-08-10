---
title: Manage gyazoctl Formula releases with maltmill
date: 2026-08-10T22:53:17+09:00
status: accepted
agent: OpenAI Codex GPT-5
amends:
  - 0002-native-distribution.md
  - 0003-linux-native-distribution.md
  - 0005-homebrew-formula-distribution.md
---

# Manage gyazoctl Formula releases with maltmill

## Context

`mktbsh/homebrew-tap`のscheduled workflowは、GitHub Releaseの取得、checksum検証、Formula生成をgyazoctl専用scriptで実装している。maltmillはGitHub ReleaseからFormulaのversion、URL、checksumを更新できるが、architectureのasset名は`amd64`または`arm64`を前提とする。v0.1.0のIntel assetは`x64`を使っている。

## Decision

- v0.1.1以降のIntel release assetは`x64`ではなく`amd64`を使う。公開済みv0.1.0 assetは変更しない。
- v0.1.1 Formulaをarm64/amd64 assetの初回baselineとして手動で更新する。
- 以後のFormulaのversion、URL、checksum更新は`maltmill -w -asset '\.tar\.gz$' Formula/gyazoctl.rb`へ委譲する。
- Formula固有のinstall、test、macOS minimum versionはRuby Formulaに保持する。
- scheduled workflowは更新後にFormulaをaudit、install、testし、成功した場合だけtap自身の`GITHUB_TOKEN`で`main`へcommitする。
- Linux Formulaはglibc互換性を確保するまで追加しない。

## Consequences

gyazoctl専用Formula rendererとGitHub Release解析処理を削除できる。release workflowと`install.sh`はIntel環境で`amd64` assetを選ぶ。GitHub ReleaseからHomebrewへの反映速度とcredential境界は変わらない。
