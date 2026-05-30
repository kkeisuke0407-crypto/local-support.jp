# 収集＋エンリッチャー 実行ガイド

> 営業可能なリストCSVを生成するツール。**メール最優先**で連絡先を抽出し、
> `config/scoring.ts` でスコアリングして CSV 出力する。送信機能は含まない。

## 0. 前提・重要な制約

- **このクラウド実行環境はネットワークが制限されており（npm/pypi/github のみ到達可）、
  政府API・企業サイトへアクセスできません。**実データ収集は
  **ネットワークが開いた環境（ローカルPC／自前サーバ）で実行してください。**
- 本ツールは「動く実装」と「サンプルseedでの動作実証」までを提供します。
  `out/leads.demo.csv` がサンプル出力です（※example系ドメインの架空企業。実在企業ではありません）。

## 1. セットアップ

```bash
cd outbound
npm install
```

## 2. 動作実証（ネットワーク不要）

```bash
npm run demo
# → out/leads.demo.csv を生成（サンプルseedをオフライン処理）
```

## 3. 本番の流れ（東京都100社）

### Step 1: seed（母集団）を用意する
`config/scoring.ts` の TargetSegment 別に、社名＋所在地（＋わかればURL）を
`data/seed.tokyo.csv` に整形する。出どころ（公開情報）：

| segment | データ取得元 |
|---|---|
| `mansion_kanri` / `fudosan_kanri` | マンション管理業協会・賃貸管理業協会の**登録業者一覧（公開）** |
| `kaigo` | **介護サービス情報公表システム**（厚労省・全国） |
| `byoin` / `clinic` | **医療機能情報提供制度**／病院名簿 |
| `shogyo_shisetsu` | 商業施設運営会社の公開リスト |

seed CSV の列（`company_name` と `segment` は必須、他は任意）：
```csv
company_name,segment,prefecture,address,website_url,contact_email,contact_form_url,phone,industry,corporate_number,employee_count,managed_property_count,facility_count,sales_refused
```

> URLが分かっていればエンリッチが速く正確。空でも可（その場合は manual 行きになりやすい）。
> 任意で `corporate_number` を法人番号APIで補完できる（`src/sources/houjinBangou.ts`、要 `HOUJIN_BANGOU_APP_ID`）。

### Step 2: 収集＋エンリッチ＋スコアリング＋CSV出力
```bash
npm run collect -- --seed data/seed.tokyo.csv --limit 100 --out out/leads.tokyo.csv --delay 1500
```

- `--delay` … 同一サイトへの礼儀的アクセス間隔(ms)。1500ms程度を推奨。
- robots.txt を尊重し、不許可ページはスキップ（`robots_allowed=false`）。
- 「営業お断り」を検出した企業は `score=0` / `contact_channel=manual` で保存。

### 出力（leads_schema.md 準拠・営業効果順にソート済み）
- 並び順：**メール経路を最優先** → スコア降順 → セグメント優先順
- 列：会社名・URL・**問い合わせメール**・フォームURL・電話・所在地・都道府県・業種・
  スコア・スコア理由・送信チャネル（`email`/`form`/`manual`）・取得元URL ほか

## 4. チャネルの意味（運用）

| channel | 意味 | 次フェーズの扱い |
|---|---|---|
| `email` | メール取得済み | **メール営業（基本）**。下書き生成→人間承認→送信 |
| `form` | メール無し・フォームのみ | フォーム営業（補助）。入力→**送信前停止→人間確認** |
| `manual` | 連絡手段なし／営業お断り | 保留。手動調査 or 除外 |

## 5. ファイル構成

```
outbound/
  config/scoring.ts          スコアリング仕様（単一ソース）
  src/
    run.ts                   CLIエントリ（収集オーケストレーション）
    sources/seed.ts          seed CSV 読み込み
    sources/houjinBangou.ts  法人番号API（任意・corporate_number補完）
    enrich.ts                公式サイト巡回→連絡先抽出（メール最優先）
    extract.ts               email/form/phone/営業お断り 抽出
    robots.ts                robots.txt 許可判定
    score.ts                 scoring.ts 連携
    csv.ts                   CSV出力（leads_schema.md準拠）
    types.ts
  data/seed.tokyo.example.csv  サンプルseed（架空企業）
  out/                        生成物（gitignore）
```
