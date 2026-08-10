---
title: Build Linux native releases on matching runners
date: 2026-08-09T23:48:24+09:00
status: accepted
agent: OpenAI Codex GPT-5
amended_by:
  - 0004-changesets-release.md
  - 0005-homebrew-formula-distribution.md
---

# Build Linux native releases on matching runners

## Context

`gyazoctl` の native executable を macOS に加えて Linux arm64/x64 に配布する。`gyazoctl` は npm dependencies を含むため `scriptc --dynamic` が必要だが、dynamic build は build host と同じ OS/architecture の executable だけを生成できる。

## Decision

- GitHub-hosted `ubuntu-24.04` と `ubuntu-24.04-arm` runner で Linux x64/arm64 を host-native build する。
- 既存の release matrix を 2 OS/2 architecture に拡張し、archive 内の executable 名は `gyazoctl` に統一する。
- Homebrew Formula は macOS/Linux の各 architecture に対応する release asset を選ぶ。
- `install.sh` は platform 判定、SHA-256 検証、binary version 確認後に `~/.local/bin` へ導入する。管理者権限は要求せず、導入先の変更は `GYAZOCTL_INSTALL_DIR` だけを公開する。

## Consequences

Linux 利用者も Node.js なしで `gyazoctl` を導入できる。4 platform の build と install smoke が成功しなければ GitHub Release は作られない。scriptc の dynamic runtime が別 OS への cross compile を提供するまでは、runner matrix を維持する必要がある。
