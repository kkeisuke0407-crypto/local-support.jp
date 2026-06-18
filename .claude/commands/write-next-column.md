---
description: docs/content-backlog.md から未公開の最上位コラム1本を書き上げ、自動でcolumns.ts/relatedColumns登録・main マージまで実施
---

# 受水槽コラム自動執筆ルーティン

## あなたの役割

あなたはロカサポ（local-support.jp）のコンテンツSEO自動執筆担当。`docs/content-backlog.md` の未公開（⬜）項目から優先度の高い1本を選んで、約5,500字級の高品質コラム記事を1本書き上げてmainにマージするまでを一気通貫で実施する。

## 実行手順

### Step 1: バックログから次のテーマを選ぶ
1. `docs/content-backlog.md` を読む
2. **優先度1 → 2 → 3 → 4 の順** で、最上位の未公開（⬜）項目を1つ選ぶ
3. 選んだテーマのKW・slug候補を確定する

### Step 2: 既存コラムとの被り確認
1. `src/data/columns.ts` と `src/pages/column/` を見て、選んだテーマと類似する既存コラムがないか確認
2. 強い被りがあればバックログの次の項目に移る（被り項目は ⏭ マークで一旦スキップ記録）

### Step 3: コラム執筆
以下のテンプレートに沿って `src/pages/column/[slug]/index.astro` を作成。約5,000〜6,000字、5〜8セクション、FAQ 5〜7問。

**構造化データ必須**: `breadcrumbLd` / `articleLd` / `faqLd` / `webPageLd` の4種。
**参考実装**: `src/pages/column/jusuisou-seisou-mansion/index.astro` をテンプレとして模写。

**含めるべき要素**:
- パンくず・カテゴリチップ・タイトル・リード文
- 3行サマリ（cl-callout）
- ColumnCtaCard（top）
- 目次（cl-toc）
- 5〜8セクション（h2 + h3 + 表・リスト・コールアウト）
- ColumnCtaCard（bottom）
- 関連記事リスト（5本）

**禁止事項**:
- 嘘の数値・統計（出典がない場合は「目安」「相場として」と限定的に表記）
- 競合サイトのコピー
- 過度な煽り・断定（「絶対」「確実に」など）
- 30秒・4問・4タップなどの旧表記（auditは「60秒・5問」）

### Step 4: メタデータ登録
1. `src/data/columns.ts` の `columns` 配列の**先頭**に新コラム情報を追加
2. 関連サービスの `src/data/services/[slug].ts` の `relatedColumns` 配列の上位に追加（既存より上に）

### Step 5: ビルド検証
`npm run build 2>&1 | tail -10` で成功確認。失敗したら原因修正。

### Step 6: バックログ更新
`docs/content-backlog.md` の該当項目のチェックボックスを `⬜` → `✅YYYY-MM-DD` に更新。

### Step 7: コミット → feature branch push（mainへの自動マージは禁止）
1. `claude/great-brown-UbJCt` ブランチで作業（なければ `git checkout -B claude/great-brown-UbJCt origin/main` で作成）
2. `Content round N: [タイトル要約] (~5500字)` 形式でコミット
3. `git push -u origin claude/great-brown-UbJCt` で feature ブランチに push
4. **mainへのマージはユーザーの明示的な指示があるまで実行しない**（人間レビューを経由）
5. ユーザーに「マージしていい？」と確認してから main へマージ＋pushを実施

## 完了時の報告フォーマット

```
✅ Content round N feature branch push 完了（mainマージ待ち）
- URL候補: /column/[slug]/
- 主KW: [メインKW]
- 字数: 約X,XXX字
- 内部リンク: X本
- ブランチ: claude/great-brown-UbJCt（origin に push 済み）
- 残りバックログ: 優先度1=X件 / 優先度2=X件 / 優先度3=X件 / 優先度4=X件
- 次回テーマ予告: [次のテーマ]

📌 main にマージしてデプロイするには「マージして」と返信してください。
```

## 注意事項

- **1回のセッションで1本のみ**書く。複数本は書かない（質を担保）。
- **CLAUDE.md の運用ルール**（trailingSlash: 'always'、6県noindex戦略、Person型author等）を遵守。
- **ブランチ運用**: `claude/great-brown-UbJCt` で作業 → mainへマージ → push
- **ビルドエラー時は迷わずrevert/修正**。中途半端な状態でpushしない。
- **記事公開後の GSC 反映には 1〜2週間** かかる。即効性は求めない。

## 引数

`$ARGUMENTS` が渡されていれば、それを**強制的なテーマ指定**として扱う（バックログ順序を無視）。
例: `/write-next-column 受水槽 撤去 直結増圧` → そのKWで執筆
