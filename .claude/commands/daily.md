---
description: 毎日の運営作業ルーティン。直近24h確認 → コラム1本執筆 → ビルド検証 → 報告まで一気通貫
---

# 毎日の運営作業ルーチン

## あなたの役割

あなたはロカサポ（local-support.jp）の運営担当 Claude。毎日1回起動され、以下のフローで運営作業を実施する。

## 実行手順

### Step 1: 直近24時間の変更状況を確認（1分）

```bash
# 直近24時間のmainコミット履歴
git log main --since="24 hours ago" --oneline

# 直近24時間のリモートブランチ動き
git fetch origin && git log origin/main --since="24 hours ago" --oneline
```

**確認ポイント**:
- CODEX から新規コラム追加があるか
- 既存記事のリライトがあるか
- 自分が前回書いたコラムがmainに反映されているか
- 何か壊れたコミットがないか

### Step 2: コンテンツ1本執筆（30〜45分）

`/write-next-column` の実行手順に従って backlog 最上位の未公開（⬜）テーマから1本書く。
**1日1本のみ**。複数本は質低下の原因になるため禁止。

**手順サマリ**（詳細は `.claude/commands/write-next-column.md` 参照）:
1. `docs/content-backlog.md` から優先度1の最上位⬜を選ぶ
2. 既存被り確認
3. 約5,500字のコラム執筆（Article/FAQPage/BreadcrumbList/WebPage構造化データ完備）
4. `data/columns.ts` に登録、サービスの `relatedColumns` に追加
5. `npm run build` で検証
6. backlog を ✅YYYY-MM-DD に更新
7. `claude/great-brown-UbJCt` ブランチに push まで実施
8. **main マージは禁止**。ユーザーの「マージして」確認を待つ

### Step 3: 整合性チェック（5分）

直近24時間にmainに追加された変更とのコンフリクト・整合性を確認:

```bash
# 旧表記がまだ残っていないか確認
grep -rn "編集長\|30秒・4問\|4タップ" src/ public/ 2>&1 | grep -v node_modules | head -5

# 名前漏れチェック
grep -rn "寺尾聡" src/pages/index.astro src/layouts/ 2>&1 | head -3
```

問題があれば次回 `/write-next-column` の前に修正タスクを優先する。

### Step 4: ビルド最終検証（2分）

```bash
npm run build 2>&1 | tail -8
```

ビルドが通らない場合は原因を特定して修正。中途半端な状態でpushしない。

### Step 5: ユーザーへの完了報告

以下のフォーマットで報告:

```
🌅 Daily Routine 完了報告（YYYY-MM-DD）

## 24時間の変更
- main コミット数：N件（うちCODEX: X件 / 私: Y件）
- 注目変更：[CODEX が新規追加した記事タイトル等]

## 本日の執筆
✅ Content round N: [タイトル]（約X,XXX字）
- URL候補: /column/[slug]/
- 主KW: [メインKW]
- ブランチ: claude/great-brown-UbJCt（push済）

## 残りバックログ
- 優先度1（害虫駆除）= N件
- 優先度2（受水槽・CODEX委譲）= ⏭
- 優先度3（隣接）= N件
- 優先度4（未対応サービス）= N件
- 優先度5（ピラー）= N件

## 翌日テーマ予告
[次回のテーマ]

## 注意事項（あれば）
- [整合性チェックで見つかった問題]
- [CODEXとの調整事項]
- [ユーザーへの相談事項]

📌 「マージして」でデプロイ反映します。
```

## 注意事項

- **1セッション = 1本のみ**（質の担保）
- **mainへの直接pushは禁止**。必ず feature branch経由で人間レビューを通す
- **ビルドエラー時は revert/修正**。中途半端な状態でpushしない
- **CODEX が同テーマを並行で書いている可能性**を必ず確認（被り回避）
- **30秒・4問・編集長 などの旧表記**を見つけたら、コラム執筆より優先して修正

## 引数

`$ARGUMENTS` が渡されていれば、それを**強制的なテーマ指定**として `/write-next-column` に渡す。
例: `/daily 倉庫 物流 IPM` → 害虫駆除の倉庫向けコラムを書く
