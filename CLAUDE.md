# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # 全ページ静的ビルド（dist/に出力）
npm run dev            # 開発サーバー起動（localhost:4321）
npm run preview        # ビルド済み成果物をローカルプレビュー

npm run fetch-gsc      # Search Console API → seo-scoring-template.csv 更新（前月データ）
npm run fetch-gsc:dry  # ドライラン（CSV更新なし・動作確認用）
npm run fetch-gsc:auth # クラウド環境用：ブラウザなしで OAuth2 認証コードを手動貼り付け
```

ビルドに失敗した場合は TypeScript 型エラーか Astro frontmatter のシンタックスエラーが原因のことが多い。`npm run build 2>&1 | tail -30` で確認する。

## アーキテクチャ概要

**Astro v5 静的サイト / Cloudflare Pages デプロイ（main ブランチ = 本番）**

### ページ生成の仕組み

3種のルートでページを生成する（現在27サービス）：

| ルート | レイアウト | 説明 |
|---|---|---|
| `/[service]/` | `ServiceLP.astro` | サービスカテゴリトップ（27サービス） |
| `/[service]/[prefecture]/` | `PrefectureServiceLP.astro` | 都道府県 × サービス（27 × 47 = 1,269ページ） |
| `/column/[slug]/` | 各コラム固有 | 記事コンテンツ（手動追加） |

都道府県 × サービスの組み合わせは `src/pages/[service]/[prefecture]/index.astro` の `getStaticPaths()` が `allServices × prefecturesData` の直積で生成する。

### データ層

```
src/data/
  site.ts              # サイト全体の定数（ブランド名・著者・ドメイン等）
  services/
    _types.ts          # ServiceData インターフェース（全フィールドの型定義）
    index.ts           # allServices[] / serviceBySlug の公開エントリ
    [service].ts       # 各サービスのコンテンツデータ（9ファイル）
  prefectures.ts       # 47都道府県データ + PRIMARY_PREFECTURE_SLUGS
```

**新しいサービスを追加する手順：**
1. `src/data/services/[slug].ts` を既存ファイルを参考に作成（`ServiceData` 型を満たすこと）
2. `src/data/services/index.ts` の `allServices` に追加
3. `src/pages/[service]/` ディレクトリを他サービスと同様に作成（または動的ルートが自動対応する構造ならそのまま）

### ブランディング

- **サイト名**：`ロカサポ`（運営組織：ローカル情報局）
- **著者**：寺尾聡（編集長・施設管理情報担当）
- **`siteName` フィールド**：各 `ServiceData` に `'ロカサポ｜[サービス名]'` 形式で設定する。これがブラウザタブ・OGP・フッターに表示される。
- 全設定は `src/data/site.ts` の `site` オブジェクト。変更するときはここだけ触れば全ページに反映する。

### noindex 戦略

主要6都府県（`PRIMARY_PREFECTURE_SLUGS` = tokyo / osaka / aichi / kanagawa / fukuoka / saitama）のみ検索インデックス対象。残り41都道府県は `noindex,nofollow`。`astro.config.mjs` の `sitemap filter` も主要6都府県のみを対象にしている。

**6都府県に絞った理由**：27サービスへ横展開した結果、インデックス対象が 27×10=270 ページに膨張し、新規ドメインでクロール予算が分散して「Discovered/Crawled – currently not indexed」が多発した。クロール予算を集中させるため 10→6 に縮小（27×6=162）。各サービスが「勝ち筋」になり地域固有データ（後述 `priceFactor`/`localFactors`）を拡充できた県から、saitama 以外の旧主要県（chiba / hokkaido / hyogo / shizuoka）を段階的に再追加する。解除条件は `docs/seo-scoring-rules.md` の「noindex解除ルール」を参照。

### 都道府県ページの独自化（重複判定対策）

都道府県ページは1サービス内で本文（法定義務・リスク・相場表・FAQ等）が47県共通のため、地名置換だけの重複（doorwayページ）と判定されやすい。これを避けるため `Prefecture` に地域固有フィールドを持たせ、各ページに固有コンテンツを生成する：

- `priceFactor?`：全国平均=1.0 とした費用水準の目安。`CostTable` が「地域の相場感」注記を生成し、`PrefectureServiceLP` の AggregateOffer 構造化データの価格レンジにも乗算する（→ 県ごとに数値が変わる）。
- `localFactors?`：その県固有の業者選び・費用・作業条件の事情（2〜4点）。`PrefectureIntro` が独自セクションとして描画する。

いずれもインデックス対象（主要6都府県）のみ設定すれば十分。未設定の県は注記・セクションを出さない。**新たにインデックス対象へ昇格させる県には、必ず `priceFactor` と `localFactors` を先に拡充してから** `PRIMARY_PREFECTURE_SLUGS` に追加すること。

### JSON-LD

- `ServiceLP.astro`：BreadcrumbList・Service・FAQPage・HowTo・AggregateOffer（5種）
- `PrefectureServiceLP.astro`：BreadcrumbList・Service・FAQPage・HowTo・AggregateOffer（5種）
- コラム記事：Article・FAQPage・BreadcrumbList
  - `author` は必ず `{ '@type': 'Person', name: site.author.name, url: site.domain + '/author/' }` を使うこと（OrganizationではなくPerson型に統一済み）

### SEO スコアリング（`docs/seo-scoring-rules.md`）

月1回、Search Console + GA4 のデータを `docs/seo-scoring-template.csv` に記録して100点満点で採点する。70点以上が「勝ち筋」→コンテンツ強化対象。スコアリングの自動化は `scripts/fetch-gsc.js`（OAuth2）が担当。

**`fetch-gsc` の前提：**
- `.env` に `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GSC_SITE_URL=sc-domain:local-support.jp` が必要
- 初回認証後に `.gsc-token.json` が生成される（gitignore済み）
- クラウド環境では `npm run fetch-gsc:auth` で手動コード貼り付け認証を使う

### コラム記事の追加

`src/pages/column/[slug]/index.astro` を手動で作成する。既存の `jusuisou-seisou-hiyo-sohba` を参考にする。`ServiceData.relatedColumns[]` に `{ href, category, title, excerpt, date }` を追加すると、サービスLPの「関連コラム」セクションに自動表示される。

## 重要な運用ルール

- **横展開は受水槽清掃が「勝ち筋（70点以上を3ヶ月連続）」になってから**。他サービスを先に強化しない。
- 都道府県ページの `noindex` を外す前に `docs/seo-scoring-rules.md` の条件を確認する。
- `trailingSlash: 'always'` が設定されているため、内部リンクは必ず末尾スラッシュ付きで記述する。
- コラム記事の公開日は `datePublished` / `dateModified` の両方に ISO日付を入れる。現在の基準年は **2026年**（`meta.lastUpdated` 等）。

## 開発ブランチ

作業ブランチ：`claude/sweet-babbage-VYZHd`（Claudeの作業用）→ `main` にマージで Cloudflare Pages が自動デプロイ。
