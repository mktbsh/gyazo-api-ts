---
title: gyazo-api-sdk rebuild tracker
date: 2026-08-09T21:56:53+09:00
---

# Rebuild tracker

- [x] T1: pnpm workspace と検証基盤を作る
- [x] T2: `gyazo-api-sdk` の型と応答 parser を作る（blocked by T1）
- [x] T3: scoped client と全 command を作る（blocked by T2）
- [x] T4: SDK のテストと package metadata を完成させる（blocked by T3）
- [x] T5: `gyazoctl` の引数 parser を作る（blocked by T4）
- [x] T6: `gyazoctl` の実行 Action と package metadata を作る（blocked by T5）
- [x] T7: workspace 全体と tarball を検証する（blocked by T6）
- [x] T8: scriptc と Perry を実機比較して native compiler を決定する（blocked by T7）
- [x] T9: scriptc native build と CLI runtime smoke を通す（blocked by T8）
- [x] T10: native release asset と npm publish workflow を作る（blocked by T9）
- [x] T11: Homebrew Formula renderer と tap 更新 job を作る（blocked by T10）
- [x] T12: package docs、release prerequisites、全配布経路を検証する（blocked by T11）
- [x] T13: Linux arm64/x64 native build と release asset を追加する（blocked by T12）
- [x] T14: `install.sh` と実行 smoke check を追加する（blocked by T13）
- [x] T15: Linux 対応 Formula、release workflow、配布文書を検証する（blocked by T14）
