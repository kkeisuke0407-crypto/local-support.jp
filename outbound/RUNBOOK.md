# ローカル実行 RUNBOOK（実データ・東京都100社）

> 目的：実サイトから母集団を取得し、**メール/フォームURLの取得率・スコアの使えそう感**を数字で確認する。
> ⚠️ このクラウド環境はネットワーク制限で実データ取得不可。**下記はあなたのローカルPC/サーバで実行**してください。

---

## 1. 事前準備（初心者向け・順番にやればOK）

### 1-1. Node.js を入れる
- **Node.js 20 以上**を推奨（22でも可）。確認：
  ```bash
  node -v        # v20.x.x など
  ```
- 入っていなければ https://nodejs.org/ から LTS をインストール。

### 1-2. コードを取得
```bash
git clone <このリポジトリ>        # すでにある場合は不要
cd local-support.jp
git checkout claude/great-brown-UbJCt
git pull
cd outbound
```

### 1-3. 依存パッケージをインストール
```bash
npm install
```

### 1-4. まず動作確認（ネットワーク不要のデモ）
```bash
npm run pipeline:demo
```
最後に「リスト品質レポート」が表示されれば準備OK。

---

## 2. 環境変数（必須なものは無し）

| 変数 | 必須 | 用途 | 設定例 |
|---|---|---|---|
| `HOUJIN_BANGOU_APP_ID` | 任意 | 法人番号APIで `corporate_number` を補完したい場合のみ。未設定なら使わないだけで動く | `export HOUJIN_BANGOU_APP_ID=xxxx` |

> メール送信やAPIキーは**今回は不要**（公開ページの取得のみ）。
> `.env` を使う場合は `outbound/.env` に書く（gitignore済み）。法人番号APIは
> https://www.houjin-bangou.nta.go.jp/ で利用申請するとIDがもらえる。

---

## 3. 実行コマンド（本番・実データ）

> 新方針：**介護・医療は公的CSVを手元に置いて読む**のが最も安定。
> まず CSV を用意（3-0）→ 一気通貫（3-1）。

### 3-0. 公的CSVを用意する（介護・医療）
取得元の詳細は `docs/data-sources.md` 参照。

1. **介護**：介護サービス情報公表システム（`https://www.kaigokensaku.mhlw.go.jp/13/`）で
   東京都＋サービス種別を検索 → **CSVダウンロード** → `outbound/data/sources/kaigo_13.csv` に保存
2. **医療**：医療機能情報提供制度（医療情報ネット）または都道府県の
   医療機能情報オープンデータCSV → `outbound/data/sources/byoin_13.csv` に保存

> `13` は東京都の都道府県コード。CSVのカラム名が多少違っても、アダプタが
> 候補名の部分一致で吸収する（`法人名称`／`開設者名称`／`所在地` 等）。
> うまく取れない場合は CSV のヘッダ行を共有してください（マッピング調整します）。

### 3-1. 一気通貫（推奨）
```bash
# 介護・医療（安定CSV）だけで母集団→リスト化
npm run pipeline -- --mode live --only-stable --pref 東京都 --limit 100 \
  --data-dir data/sources \
  --seed-out data/seed.tokyo.csv \
  --out out/leads.tokyo.csv \
  --delay 1500
```
- `--only-stable` … 安定取得元（介護・医療のCSV）だけに絞る（HTML系の不動産等を除外）
- `--data-dir` … 手動DLしたCSVの置き場（既定 `data/sources`）
- `--mode live` … 本番（fixtureではない）
- `--delay 1500` … サイト巡回（メール抽出）の礼儀的間隔

> HTML系（マンション管理・不動産・商業施設）も含めて試すなら `--only-stable` を外す。
> ただし現状その3つは取得元URL/セレクタ未確定のため 0〜少数になり得る（後回し対象）。

### 段階実行したい場合
```bash
# (1) 母集団だけ作る
npm run seed -- --mode live --pref 東京都 --limit 100 --out data/seed.tokyo.csv
# (2) seed をエンリッチ＋スコア＋CSV
npm run collect -- --seed data/seed.tokyo.csv --limit 100 --out out/leads.tokyo.csv
```

### 実行後にレポートを再表示
```bash
npm run report -- --in out/leads.tokyo.csv
```

---

## 4. 出力ファイルの場所

| ファイル | 内容 |
|---|---|
| `outbound/out/leads.tokyo.csv` | **最終成果物**＝営業可能リスト（営業効果順ソート済み） |
| `outbound/out/leads.tokyo.stats.json` | 指標サマリ（report で再表示に使う） |
| `outbound/data/seed.tokyo.csv` | 取得した母集団（中間生成物） |

> CSVはExcelでそのまま開けます（BOM付きUTF-8）。

---

## 5. 失敗したときの確認ポイント

| 症状 | 原因 | 対処 |
|---|---|---|
| **介護/医療が0社** | `data/sources/kaigo_13.csv` 等が未配置 | 3-0でCSVをダウンロードして配置（ログに「CSV未配置」と出る） |
| **会社名カラムが見つかりません** | CSVのヘッダ名が想定外 | ヘッダ行を共有 → `kaigo.ts`/`byoin.ts` の `column` 候補に追加 |
| **HTML系（管理/不動産/商業）が0社** | 取得元URL/セレクタ未確定（後回し対象） | `--only-stable` で除外して進める。実装は実サイトHTML入手後 |
| `[robots] skip ...` が大量 | robots.txt で禁止 | そのサイトは対象外（正常動作）。電話のみ手動取得へ |
| `[fetch error] ... timeout` | サイトが遅い/落ちてる | `--delay` を上げる／時間をおく |
| メール取得が極端に低い | サイトがフォームのみ or メールを画像化 | `form` 経路として活用（仕様どおり）。manual増は想定内 |
| `未知の都道府県` エラー | `--pref` の表記ミス | `東京都` のように正式名で（`prefs.ts` 参照） |
| `command not found: tsx` | `npm install` 未実行 | `npm install` を実行 |
| 全部 manual になる | `--mode live` を付け忘れ／`--no-fetch` が付いている | コマンドを再確認 |

> **重要**：母集団が0でも慌てないでください。これは「実サイトのHTML構造に
> セレクタを合わせる作業」が残っているだけで、パイプライン自体は正常です。
> その場合は取得元ページのHTMLを共有してもらえれば、セレクタを修正します。

---

## 6. 実行後に見るべき指標

`npm run pipeline` の最後、または `npm run report` で下記が出ます：

```
収集総数        : ___      ← 取得元から拾えた数（重複排除前）
重複除外件数    : ___      ← ダブり除外できた数
最終出力社数    : ___      ← CSVの行数

メール取得      : ___ (__%)  ← ★最重要。メール営業できる母数
フォームURL取得 : ___ (__%)  ← フォーム営業（補助）できる母数
manual          : ___ (__%)  ← 連絡手段なし/営業お断り

スコア80以上    : ___ (__%)  ← 優先アタックリスト
スコア60以上    : ___ (__%)  ← 営業対象の現実的な母数
営業お断り検出  : ___        ← 除外すべき件数

セグメント別    : mansion=__ / fudosan=__ / kaigo=__ / shogyo=__ / byoin=__
```

### 改善方針の判断目安（実行後に一緒に見ます）
- **メール取得率が低い（例 <30%）** → 取得元の見直し or エンリッチのメール抽出強化
- **manualが多い** → seed取得元にURL列を持つソースを足す／URL特定ロジック追加
- **スコア60以上が少ない** → スコア配点 or ターゲットセグメントの再検討
- **母集団が集まらない** → 取得元アダプタのセレクタ修正（最優先）

---

## 次のアクション
実行できたら、**`out/leads.tokyo.stats.json` の中身**か、`npm run report` の出力を共有してください。
その数字を見て、次の改善（セレクタ修正／取得元追加／スコア調整）を一緒に決めます。
