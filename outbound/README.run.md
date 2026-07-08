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
npm run pipeline:demo   # seed自動取得→エンリッチ→スコア→CSV を fixture で一気通貫
npm run seed:demo       # seed自動取得のみ（fixture）
npm run demo            # seedを与えてエンリッチ→CSV（旧来のサンプルseed処理）
```

`pipeline:demo` は `fixtures/*.html`（架空データ）から母集団を作り、重複排除して
`data/seed.tokyo.demo.csv` と `out/leads.pipeline.demo.csv` を生成する。

## 3. 本番の流れ（東京都100社）

### 一気通貫（推奨）
seed自動取得 → エンリッチ → スコアリング → CSV を1コマンドで：
```bash
npm run pipeline -- --pref 東京都 --limit 100 \
  --seed-out data/seed.tokyo.csv --out out/leads.tokyo.csv --delay 1500
```

### 段階実行
```bash
# (1) 母集団だけ自動生成
npm run seed -- --pref 東京都 --limit 100 --out data/seed.tokyo.csv
# (2) その seed をエンリッチ＋スコア＋CSV
npm run collect -- --seed data/seed.tokyo.csv --limit 100 --out out/leads.tokyo.csv
```

### seed自動取得の取得元（セグメント別・優先順位順）

| 優先 | segment | 取得元アダプタ（`src/seedsources/`） |
|---|---|---|
| 1 | `mansion_kanri` | マンション管理業協会 会員一覧 |
| 1 | `fudosan_kanri` | 賃貸住宅管理業者 登録一覧 |
| 2 | `kaigo` | 介護サービス情報公表システム |
| 3 | `shogyo_shisetsu` | 日本ショッピングセンター協会 会員一覧 |
| 4 | `byoin` | 医療情報ネット（医療機能情報提供制度） |

- 各レコードに **取得元URL（`seed_source_url`）** を必ず保存。
- **重複排除**：法人番号があれば最優先キー、無ければ「正規化社名＋都道府県」。優先順位の高い取得元を残す（先勝ち）。
- 任意で `corporate_number` を法人番号APIで補完（`src/sources/houjinBangou.ts`、要 `HOUJIN_BANGOU_APP_ID`）。

> ⚠️ 各アダプタの `liveListUrls()` と `parseList()` のセレクタは、
> **実サイトのマークアップに合わせて稼働時に要調整**（公開ディレクトリは構造が変わるため）。
> fixture は既定セレクタ（`tr.company` / `.name` / `.address` / `.corporate-number`）に合わせてある。

### 共通オプション
- `--pref` … 都道府県名（全国対応。`src/seedsources/prefs.ts` に47都道府県コード）。
- `--per-segment N` … セグメントごとの取得上限。
- `--mode live|fixture` … 取得元（本番=HTTP / デモ=fixture）。
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
    pipeline.ts              一気通貫CLI（seed取得→エンリッチ→スコア→CSV）
    seedBuild.ts             seed自動取得CLI（母集団生成のみ）
    run.ts                   エンリッチCLI（既存seedを処理）
    seedsources/
      index.ts               レジストリ・重複排除・runSeedSources()
      types.ts               SeedSource / FetchFn / PrefRef
      fetcher.ts             httpFetch（本番）/ fixtureFetch（デモ）
      parseUtil.ts           リストHTML共通パーサ
      prefs.ts               47都道府県コード
      mansionKanri.ts / fudosanKanri.ts / kaigo.ts / shogyo.ts / byoin.ts
    sources/seed.ts          seed CSV 読み込み
    sources/houjinBangou.ts  法人番号API（任意・corporate_number補完）
    enrich.ts                公式サイト巡回→連絡先抽出（メール最優先）
    extract.ts               email/form/phone/営業お断り 抽出
    robots.ts                robots.txt 許可判定
    score.ts                 scoring.ts 連携
    prioritize.ts            営業効果順ソート（email>form>manual）
    csv.ts / seedCsv.ts      CSV出力
    types.ts
  fixtures/*.html            デモ用サンプルHTML（架空データ）
  data/seed.tokyo.example.csv  サンプルseed（架空企業）
  out/                        生成物（gitignore）
```
