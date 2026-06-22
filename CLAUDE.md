# CLAUDE.md

ロカサポ（local-support.jp）= 施設管理B2Bマッチング。Astro v5 静的サイト / Cloudflare Pages（mainブランチ=本番）。

## Commands
- `npm run build` / `npm run dev` / `npm run preview`
- `npm run fetch-gsc[:dry|:auth]` — Search Console → `docs/seo-scoring-template.csv`
- ビルド失敗時は `npm run build 2>&1 | tail -30`

## ページ生成（27サービス×47県）
- `/[service]/` → `ServiceLP.astro`
- `/[service]/[prefecture]/` → `PrefectureServiceLP.astro`（27×47=1,269p、`getStaticPaths`で直積）
- `/column/[slug]/` → 手動追加

## データ層
```
src/data/
  site.ts                # ブランド名・著者・ドメイン
  services/_types.ts     # ServiceData 型
  services/index.ts      # allServices / serviceBySlug
  services/[slug].ts     # サービス毎データ
  prefectures.ts         # 47県 + PRIMARY_PREFECTURE_SLUGS
```
新サービス追加: `services/[slug].ts` 作成 → `services/index.ts` の `allServices` に追加。

## ブランディング
- サイト名 `ロカサポ`（運営: ローカル情報局） / 著者 寺尾聡（運営者・施設管理情報担当）
- `siteName`: `'ロカサポ｜[サービス名]'` 形式
- 全設定は `src/data/site.ts`

## noindex 戦略
インデックス対象は主要6都府県のみ（`PRIMARY_PREFECTURE_SLUGS` = tokyo / osaka / aichi / kanagawa / fukuoka / saitama）。残り41県は `noindex,nofollow`。`astro.config.mjs` の sitemap filter も同様。新たに昇格させる県は `priceFactor`/`localFactors` を先に拡充。解除条件は `docs/seo-scoring-rules.md`。

## 都道府県ページの独自化
重複判定回避のため `Prefecture` に地域固有フィールド:
- `priceFactor?` — 全国平均=1.0、`CostTable` 注記＋ AggregateOffer 価格レンジに乗算
- `localFactors?` — 県固有事情 2〜4点、`PrefectureIntro` が描画

## JSON-LD
- `ServiceLP` / `PrefectureServiceLP`: BreadcrumbList・Service・FAQPage・HowTo・AggregateOffer
- コラム: Article・FAQPage・BreadcrumbList（`author` は Person 型固定: `{ '@type':'Person', name: site.author.name, url: site.domain + '/author/' }`）

## SEO スコアリング
月1回 `docs/seo-scoring-template.csv` に記録、100点満点。70点以上=勝ち筋。自動化は `scripts/fetch-gsc.js`（OAuth2）。`.env` に `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GSC_SITE_URL=sc-domain:local-support.jp` 必須。クラウドは `npm run fetch-gsc:auth`。

## コラム
`src/pages/column/[slug]/index.astro` を手動作成。テンプレ: `jusuisou-seisou-mansion`（Article + FAQPage + BreadcrumbList + WebPage の4種完備）。`ServiceData.relatedColumns[]` に追加で自動表示。

## コンテンツSEO ルーティン
週1〜2本、`docs/content-backlog.md` の優先度順。
- `/write-next-column` で1本執筆→`claude/great-brown-UbJCt` に push
- `/daily` で 24h差分確認→1本執筆→ビルド検証まで
- 1セッション1本のみ。**mainマージは「マージして」確認後に実施**

## 重要ルール
- 横展開は害虫駆除が「勝ち筋（70点以上3ヶ月）」になってから（初CV: 2026-06-19 海潤貿易 PCO-2026-0619-001）
- `trailingSlash: 'always'` — 内部リンク末尾スラッシュ必須
- 公開日は `datePublished`/`dateModified` 両方にISO日付。基準年は **2026年**
- 旧表記禁止: `編集長`（→運営者）/ `30秒・4問`（→60秒・5問）/ `4タップ`
- **タイトルへの年号付与禁止**（例: `〜2026`）。鮮度は本文の「※YYYY年M月時点」注記で担保。例外: 補助金・法令年度版記事は `〜2026年度版` 可

## ブランチ運用
作業: `claude/great-brown-UbJCt` → main マージで Cloudflare 自動デプロイ
1. `git checkout -B claude/great-brown-UbJCt origin/main`（必要時）
2. commit → `git push -u origin claude/great-brown-UbJCt`
3. `git checkout main && git merge --no-ff claude/great-brown-UbJCt -m "Merge ..."` → push
