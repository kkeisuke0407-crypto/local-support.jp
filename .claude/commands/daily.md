---
description: 毎日の運営作業ルーチン。24h差分確認→コラム1本執筆→整合性チェック→ビルド検証→報告
---

# Daily ルーチン

## Step 1: 24時間の変更確認
```bash
git log main --since="24 hours ago" --oneline
git fetch origin && git log origin/main --since="24 hours ago" --oneline
```
確認: CODEX 追加・既存リライト・前回コミット反映・壊れたコミット。

## Step 2: コラム1本執筆
`/write-next-column` の手順で1本。**1日1本のみ**。

## Step 3: 整合性チェック
```bash
grep -rn "編集長\|30秒・4問\|4タップ" src/ public/ 2>&1 | grep -v node_modules | head -5
grep -rn "寺尾聡" src/pages/index.astro src/layouts/ 2>&1 | head -3
```
問題があれば執筆より優先して修正。

## Step 4: ビルド最終検証
```bash
npm run build 2>&1 | tail -8
```

## Step 5: 完了報告

```
🌅 Daily Routine 完了報告（YYYY-MM-DD）

## 24時間の変更
- main コミット数：N件
- 注目変更：[要点]

## 本日の執筆
✅ Content round N: [タイトル]（約X,XXX字）
- URL: /column/[slug]/
- 主KW: [メインKW]
- ブランチ: claude/great-brown-UbJCt（push済）

## 残りバックログ
- P1（害虫駆除）= N件 / P2 = ⏭ / P3 = N件 / P4 = N件 / P5 = N件

## 翌日テーマ予告
[次回]

## 注意事項
- [整合性問題・CODEX調整・相談事項]

📌 「マージして」でデプロイ反映。
```

## 注意
- 1セッション1本のみ
- main直push禁止、必ず feature branch経由
- 旧表記（編集長 / 30秒・4問）見つけたら執筆より優先
- `$ARGUMENTS` があれば `/write-next-column` に強制テーマとして渡す
