# スプシ同期（案件トラッカー）

`docs/sheet-tab*.csv` を Googleスプレッドシート「ロカサポ 案件トラッカー」へ反映する方法。

> 🔁 **2026-08-27 方式変更：本命を Apps Script に入れ替えた。**（8/20 は IMPORTDATA を本命としていた）
> 理由は **クラウドセッションのコンテナが毎回まっさらで、`.env` も `.sheet-token.json` も残らない**こと。
> `npm run push-sheet` は動作するが、セッションのたびに OAuth 情報の再投入と再認証が必要で、
> 「毎回スプシが更新されない」という詰まりの原因になっていた。
> IMPORTDATA は**一度式を貼れば以降 push するだけで自動反映**され、認証情報を一切必要としない。

| | |
|---|---|
| スプシ | [ロカサポ 案件トラッカー](https://docs.google.com/spreadsheets/d/1Zdt7d8luN6o4D9YgQwZ0D2kGRwew5uLtdY8pdZynrqg/edit) |
| 所有者 | `support@local-support.jp` |
| タブ | `依頼者`（← `docs/sheet-tab1-cases.csv`） / `業者`（← `docs/sheet-tab2-quotes.csv`） |

---

## 方式の比較（2026-08-27 時点）

| | Apps Script | IMPORTDATA | push-sheet | 手動インポート |
|---|---|---|---|---|
| セットアップ | 一度だけ（貼り付け＋トリガー） | 一度だけ（式を2つ） | 毎セッション | 毎回 |
| 認証情報 | 不要 | 不要 | **必要**（.env＋OAuth） | 不要 |
| 自動更新 | ✅ 1時間ごと | ✅ 1時間以内 | ❌ 手動実行 | ❌ 手動 |
| 手編集の余地 | ✅ **別タブ・別列で可** | ❌ 不可 | ✅ 可 | ✅ 可 |
| 壊れたCSVへの防御 | ✅ **列数を検算して中止** | ❌ そのまま流入 | ✅ あり | ❌ なし |
| 同期できたか分かる | ✅ `_sync_log` タブ | ❌ 分からない | ✅ 実行結果 | — |
| 日付のシリアル化 | ✅ 防止済 | ⚠️ 起きる | ✅ 防止済 | ⚠️ 起きる |
| 今すぐ同期 | ✅ メニューから | △ 式の再入力 | ✅ | ✅ |

> ✅ **本命は Apps Script。** クラウドセッションのコンテナは毎回まっさらで
> `.env` も `.sheet-token.json` も残らないため、`push-sheet` は「常に最新」の手段にならない。
> Apps Script は**Google側で動く**ので、こちらの環境に一切依存しない。

---

## 方式1：Apps Script（本命・推奨）

スクリプト本体は **`docs/sheet-apps-script.gs`**。セットアップ手順もファイル冒頭に書いてある。

### セットアップ（一度だけ・5分）

1. スプレッドシート → 拡張機能 → Apps Script
2. `docs/sheet-apps-script.gs` の中身を全部貼り付けて保存
3. 関数 `syncAll` を選んで実行（初回だけ承認が必要）
4. トリガー（時計アイコン）→ `syncAll` を **1時間おき** の時間主導型で登録

以降は **git に push すれば最大1時間で反映**される。
急ぐときはスプレッドシートのメニュー **「ロカサポ」→「今すぐ同期」**。

### この方式だけが持っている利点

- **壊れたCSVでタブを潰さない。** 列数を検算し、想定と違えばそのタブの更新を中止する
- **同期できたか確認できる。** `_sync_log` タブに実行時刻と結果が積まれる
- **手編集を共存させられる。** スクリプトが書くのは `依頼者` / `業者` の2タブだけなので、
  メモ用のタブを別に作れば消されない
- **日付がシリアル値に化けない**（書き込み前に範囲を書式なしテキストにしている）

### 制約

- 反映は最大1時間遅れる（急ぐならメニューから手動同期）
- `依頼者` / `業者` タブへの直接の書き込みは、次の同期で消える
- リポジトリが public であることが前提（private 化したら方式3へ）

---

## 方式2：`IMPORTDATA`（簡易版）

各タブの **A1** に式を1つ貼るだけ。Apps Script より手軽だが、
検算も実行ログもなく、日付がシリアル値に化ける。

```
=IMPORTDATA("https://raw.githubusercontent.com/kkeisuke0407-crypto/local-support.jp/main/docs/sheet-tab1-cases.csv")
=IMPORTDATA("https://raw.githubusercontent.com/kkeisuke0407-crypto/local-support.jp/main/docs/sheet-tab2-quotes.csv")
```

---

## 方式3：`npm run push-sheet`（フォールバック）

Sheets API v4 に OAuth2 で直接書き込む（`scripts/push-sheet.js`）。
ローカル環境で使うなら有効だが、**クラウドセッションではコンテナが毎回まっさらになり
`.env` と `.sheet-token.json` が残らない**ため、「常に最新」の手段にはならない。

セットアップ：Google Cloud Console で Sheets API を有効化 →
`.env` に `SHEET_ID` と `TOKEN_ENCRYPTION_KEY` を追記 → `npm run push-sheet:auth` で初回認証
（**スプシの所有者アカウント `support@local-support.jp` で認証すること**）。

```
npm run push-sheet:dry    # CSVの行数・列数だけ検証
npm run push-sheet        # 2タブを最新CSVで置き換え
```

書き込み前にタブを clear し、`valueInputOption: 'RAW'` で日付のシリアル化を防いでいる。

---

## Claude（AIセッション）からできること・できないこと

| | 可否 |
|---|---|
| スプシの**読み取り** | ✅ Drive コネクタで可 |
| Drive コネクタでの**書き込み** | ❌ セル・行を更新するツールが無い（`search`/`read`/`download`/`get_metadata`/`get_permissions`/`list_recent`/`create_file`/`copy_file` の7つのみ） |
| Google Sheets **コネクタ** | ❌ コネクタレジストリに存在しない（2026-08-05 確認。Google系は Drive / Calendar のみ） |
| **`npm run push-sheet` の実行** | ⚠️ スクリプトは動くが `.env`（OAuth情報）とトークンが必要。認証は人間が一度行う |

> 📌 **2026-08-05 の訂正**：当初このドキュメントに「Sheets API はネットワークポリシーで遮断されている」と
> 書いたが**誤り**。実測すると `sheets.googleapis.com` / `oauth2.googleapis.com` / `accounts.google.com` は
> いずれも到達できる（HTTPレスポンスが返る）。遮断されているのは業者サイト等の一般Webホストで、
> **Google API は許可されている**。この誤認のせいで「書き込みは原理的に不可能」と結論づけていた。
> ネットワーク到達性は推測せず `curl -o /dev/null -w "%{http_code}"` で必ず実測すること
> （proxy による遮断は `curl: (56) CONNECT tunnel failed, response 403` になる）。

---

## 個人情報の扱い（重要）

**リポジトリは public。CSV に書いた内容はインターネットに公開される。**

2026-08-05 に、依頼者・業者担当者のメールアドレス計6件と依頼者の電話番号1件が公開状態に
なっていたため、すべて `support@ 受信箱を参照` に置換した。以後、CSV および `leads-log.md` には
次を書かない：

- 依頼者・業者担当者の**個人メールアドレス**
- 依頼者の**電話番号**（企業の代表番号は可）
- 個人宅の住所

連絡先の正本は **`support@local-support.jp` の受信箱**（`leads-log.md` 冒頭の運用ルールと同じ）。
CSV には `案件ID` と `担当者名` までを書き、詳細はメールを引く。

> 📌 過去のコミット履歴には削除前の値が残る。完全に消すには履歴の書き換え、
> またはリポジトリの private 化が必要。private 化した場合、方式1（IMPORTDATA）は使えなくなるが、
> **方式2（push-sheet）は影響を受けない。**

`.gsc-token.json` / `.sheet-token.json` / `.env` は `.gitignore` 済み。**絶対にコミットしないこと。**
