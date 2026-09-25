# SEO実績レビュー 2026-09-25（Search Console 過去3か月＋GA4＋CV台帳）

> 出典：GSC 検索パフォーマンス（ウェブ・過去3か月＝6/23〜9/22）、GA4 ページ別（6/27〜9/24）、
> `docs/sheet-tab1-cases.csv` のCV流入元。GSCはGoogleのみ。Bingは未計測（Bing Webmaster Tools 未確認）。

## 1. 結論

- **Googleは伸びている**。コラム追加が7/16で止まっているのに、表示は7月740→8月1,386→9月（22日まで）1,032。平均順位も17.9位→10〜14位に改善
- **ただしCVを生んでいるのはBingとChatGPT**。9月のCV10件の流入元は Bing 7／ChatGPT 1／Google 1／不明 1
- **勝ち筋は消防設備点検**。9月CV10件のうち5件が消防・防火対象物点検。着地は /shobo-setsubi/tokyo/ ×2、/shobo-setsubi/fukuoka/、/shobo-setsubi/、/bouka-tenken/tokyo/
- 8/26レビューの施策（サービスLPのtitle改修ほか）は**未着手**

## 2. Google（過去3か月）

| 指標 | 値 | 参考：8/26時点（過去6か月） |
|---|---|---|
| クリック | 72 | 42 |
| 表示 | 3,299 | 1,937 |
| CTR | 2.18% | 2.17% |

月別：6月(23日〜) 2/141 → 7月 22/740 → 8月 19/1,386 → 9月(〜22日) 29/1,032

| 区分 | ページ数 | クリック | 表示 | CTR |
|---|---|---|---|---|
| コラム | 72 | 45 | 2,290 | 1.97% |
| サービスLP・固定 | 33 | 18 | 782 | 2.30% |
| 県別LP | 82 | 9 | 417 | 2.16% |

クエリは3,299表示中190しか開示されない（94%が匿名化）＝まだロングテール極小ボリューム帯。

### 表示はあるのにクリックが取れていないページ（CTR救出の対象）

| ページ | 表示 | 順位 | クリック |
|---|---|---|---|
| /column/shobo-setsubi-fuzai-tachiai/ | 130 | 9.1 | 0 |
| /johkasou/ | 172 | 6.1 | 3（1.7%。6位なら5%超が目安） |
| /column/jusuisou-seisou-horei-gimu/ | 246 | 7.7 | 3（1.2%） |
| /column/shobo-setsubi-horei-gimu/ | 103 | 9.8 | 1 |
| /column/shobo-setsubi-jibun-de/ | 95 | 8.1 | 1 |
| /column/johkasou-blower/ | 60 | 8.9 | 0 |
| /column/johkasou-hiyo-sohba/ | 47 | 9.9 | 0 |
| /zanchibutsu/ | 33 | 7.3 | 0 |

手本：/column/asbestos-hojokin/ は 74表示・CTR 6.8%（補助金＝検索者の得が明確なタイトル）。

## 3. 存在しないURLへのアクセス（AIの誤案内の疑い）

GA4に `/pest-control-haccp/` と `/pest-control/fukuoka/pest-control-haccp/` へのアクセスがある。
サイト内のリンクはすべて `/column/pest-control-haccp/` で正しい。外部（AIの回答など）が
`/column/` を落としたURLを案内している可能性が高い。→ コラムslugの直下URLを `/column/` へ301する。

## 4. 施策（優先順）

1. Bing Webmaster Tools の確認・登録と IndexNow 実装（CVの7割とChatGPT経由の土台）
2. §2 のCTR救出8ページの title/description 改修（消防3本を最優先）
3. 消防設備点検バーティカルの強化：実案件から出たテーマのコラム追加、東京・福岡・埼玉の県別LPの厚み付け、`case/` への匿名事例
4. コラムslug直下URLの301（§3）
5. コラム週1本の再開（消防→浄化槽）、CLAUDE.md の横展開条件を「CVが出たサービス優先」へ
6. AI引用の月次チェック再開（`aio-test-queries.md`）

## 5. 未取得のデータ

- Bing Webmaster Tools の検索パフォーマンス（クエリ・ページ）
- GA4 のトラフィック獲得（セッションの参照元/メディア × ランディングページ）
- GSC のページのインデックス登録（未登録の理由の内訳）
