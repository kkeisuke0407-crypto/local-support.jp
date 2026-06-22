---
description: backlog 最上位の未公開コラム1本を執筆→feature branch にpush（mainマージは別途確認）
---

# コラム自動執筆ルーチン

`docs/content-backlog.md` の未公開（⬜）から優先度1→2→3→4の順で1つ選び、約5,500字級の記事1本を仕上げて `claude/great-brown-UbJCt` に push する。

## 手順

1. **テーマ選定**: `docs/content-backlog.md` の最上位⬜を選ぶ。`$ARGUMENTS` があればそれを強制テーマに。
2. **被り確認**: `src/data/columns.ts` と `src/pages/column/` で類似テーマがあれば ⏭ マークしてスキップ。
3. **執筆**: `src/pages/column/[slug]/index.astro` 作成。テンプレ参考: `jusuisou-seisou-mansion`。
   - 約5,000〜6,000字、5〜8セクション、FAQ 5〜7問
   - 構造化データ4種必須: `breadcrumbLd` / `articleLd` / `faqLd` / `webPageLd`
   - 構成: パンくず・カテゴリ・タイトル・リード・3行サマリ・CtaCard(top)・目次・本文・CtaCard(bottom)・関連記事5本
   - **禁止**: 嘘の数値/出典不明な統計（→「目安」「相場として」）、競合コピー、過度な煽り、`30秒・4問`等の旧表記
4. **登録**: `src/data/columns.ts` の `columns` 配列**先頭**に追加。関連 `services/[slug].ts` の `relatedColumns` 上位に追加。
5. **検証**: `npm run build 2>&1 | tail -10` で成功確認。
6. **backlog 更新**: 該当を `⬜` → `✅YYYY-MM-DD`。
7. **push**: `claude/great-brown-UbJCt` にコミット→`git push -u origin claude/great-brown-UbJCt`。コミット: `Content round N: [タイトル要約] (~5500字)`。
8. **mainマージは禁止**。ユーザーの「マージして」を待つ。

## 完了報告

```
✅ Content round N feature branch push 完了
- URL: /column/[slug]/
- 主KW: [メインKW]
- 字数: 約X,XXX字
- ブランチ: claude/great-brown-UbJCt
- 残り backlog: P1=X / P2=X / P3=X / P4=X
- 次回テーマ予告: [次のテーマ]

📌 main マージは「マージして」と返信してください。
```

## 注意

- 1セッション1本のみ
- CLAUDE.md ルール（trailingSlash, 6県noindex, Person型author）遵守
- ビルドエラー時は迷わず修正、中途半端な状態でpushしない
