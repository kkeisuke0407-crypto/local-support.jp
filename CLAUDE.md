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

## マッチング運用方針（2026-08-05 決定・全エージェント共通）

### 1. 紹介社数は「最大5社」に統一
**旧「最大3社」は全廃**。サイト内表記・`ServiceData.trustStats`・`meta.title`/`description`・コラム・`llms.txt` すべてを **最大5社** に統一する。新規作成物も必ず5社で書く。

### 2. 概算見積は運営が出さない（業者プロフィール比較へ移行）
運営が業者から概算を聞き取って比較表を作る方式は**廃止**する。

- **理由**：アイミツ・発注ナビ・ミツモア・くらしのマーケットいずれも、プラットフォーム自身は見積を作らず**業者が出す**構造。運営が概算を集める現行方式は競合より工数が重く、案件増でスケールしない。業者も「現地を見ないと出せない」が本音で、無理に引き出した概算は参考値にしかならない
- **切り分け**：
  - **一般的な費用相場** → コラムで提供（**SEOの主戦場なので維持**。触らない）
  - **個別案件の実額** → 業者が依頼者へ直接提示（運営は介在しない）
- **訴求の軸**：「価格を比較できる」→「**探す手間ゼロ・審査済みの業者が見つかる**」
- **概算レンジ欄は任意**。出せる業者だけ記入する形にし、強制しない

### 3. 業者比較ページ（一覧）の設計方針
- **目的**：依頼者が見て「**ここいいね！**」と即断できること。価格ではなく**運用条件の差**で選べるようにする
- **構成**：**共通テンプレ ＋ サービスごとの個別版**。**依頼が来たサービスから順に**作る（先回りして全27サービス分は作らない）
- **着手タイミング**：⚠️ **新規案件が発生してから作る**。テンプレを含め、案件が無いうちに先回りして設計・実装しない（2026-08-05 ユーザー判断）
- **載せる項目**（PCO案件で実際に差が出たものを基準にする）：
  資格・登録・協会会員／**現地調査の要否と費用**（日本防疫=15,000円 vs 九州CIC=無料で差が出た）／対応可能な時間帯（稼働中・夜間）／記録・報告書の発行可否（HACCP・消防報告書）／対応エリアと拠点からの距離／得意な施設タイプ／実績・規模

### 4. 既存案件の扱い
`PCO-2026-0619-001`（害虫・福岡）と `SOL-2026-0718-001`（太陽光・兵庫）は**現行方式のまま完了させる**。新方式は次の案件から適用。

### 5. 現在の作業優先順位
**サイト内容の細部確認・修正が最優先**（上記1の5社統一を含む）。比較ページの新設計はその後。

## 重要ルール
- 横展開は害虫駆除が「勝ち筋（70点以上3ヶ月）」になってから（初CV: 2026-06-19 海潤貿易 PCO-2026-0619-001）
- `trailingSlash: 'always'` — 内部リンク末尾スラッシュ必須
- 公開日は `datePublished`/`dateModified` 両方にISO日付。基準年は **2026年**
- 旧表記禁止: `編集長`（→運営者）/ `30秒・4問`（→60秒・5問）/ `4タップ` / **`最大3社`（→最大5社）**
- **タイトルへの年号付与禁止**（例: `〜2026`）。鮮度は本文の「※YYYY年M月時点」注記で担保。例外: 補助金・法令年度版記事は `〜2026年度版` 可

## ブランチ運用
作業: `claude/great-brown-UbJCt` → main マージで Cloudflare 自動デプロイ
1. `git checkout -B claude/great-brown-UbJCt origin/main`（必要時）
2. commit → `git push -u origin claude/great-brown-UbJCt`
3. `git checkout main && git merge --no-ff claude/great-brown-UbJCt -m "Merge ..."` → push
