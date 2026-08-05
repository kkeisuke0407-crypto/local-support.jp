# スプシ同期（案件トラッカー）

`docs/sheet-tab*.csv` を Googleスプレッドシート「ロカサポ 案件トラッカー」へ反映する方法。
**手動インポートは不要。`npm run push-sheet` で直接書き込む。**

| | |
|---|---|
| スプシ | [ロカサポ 案件トラッカー](https://docs.google.com/spreadsheets/d/1Zdt7d8luN6o4D9YgQwZ0D2kGRwew5uLtdY8pdZynrqg/edit) |
| 所有者 | `support@local-support.jp` |
| タブ | `依頼者`（← `docs/sheet-tab1-cases.csv`） / `業者`（← `docs/sheet-tab2-quotes.csv`） |

---

## 方式A：`npm run push-sheet`（本命）

Sheets API v4 に OAuth2 で直接書き込む。`scripts/push-sheet.js`。
認証まわりは `scripts/fetch-gsc.js` と同じ仕組み（OAuth2＋トークンをAES-256-CBCで暗号化保存）。

### セットアップ（初回のみ）

1. **Google Cloud Console で「Google Sheets API」を有効化**
   （Search Console API とは別枠。これを忘れると `accessNotConfigured` で落ちる）

2. `.env` に追記（`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` は fetch-gsc と共通）
   ```
   SHEET_ID=1Zdt7d8luN6o4D9YgQwZ0D2kGRwew5uLtdY8pdZynrqg
   TOKEN_ENCRYPTION_KEY=（初回実行時に出力される32バイトhexを固定）
   ```

3. 初回認証
   ```
   npm run push-sheet:auth    # クラウド／ブラウザが開けない環境（コード貼り付け）
   npm run push-sheet         # ローカル（ブラウザが自動で開く）
   ```
   > ⚠️ **スプシの所有者アカウント（`support@local-support.jp`）で認証すること。**
   > 別アカウントで認証すると `Requested entity was not found` になる。
   > 2026-08-05 に Drive コネクタが `fuhyo.consulting@gmail.com` に繋がっていて
   > スプシが見つからなかったのと同じ現象。

### 通常実行

```
npm run push-sheet:dry    # CSVの行数・列数だけ検証（認証も書き込みもしない）
npm run push-sheet        # 2タブを最新CSVで置き換え
```

### 仕様

- **書き込み前にタブ全体を `clear`** する。行が減っても古い行が残らない
- **`valueInputOption: 'RAW'`**。これがないと `2026-06-19` が `46192` のようなシリアル値に化ける
  （2026-08-05 の手動インポートで実際に発生した）
- タブが存在しない場合は自動作成
- **実行前にCSVの列数を検証**し、不揃いなら認証前に停止する

---

## 方式B：`IMPORTDATA`（フォールバック）

スプシ側から GitHub の raw CSV を読ませる。`.env` もトークンも不要だが、制約が大きい。

新規タブ `依頼者_sync` / `業者_sync` を作り、それぞれ **A1** に:

```
=IMPORTDATA("https://raw.githubusercontent.com/kkeisuke0407-crypto/local-support.jp/main/docs/sheet-tab1-cases.csv")
```
```
=IMPORTDATA("https://raw.githubusercontent.com/kkeisuke0407-crypto/local-support.jp/main/docs/sheet-tab2-quotes.csv")
```

| 制約 | 内容 |
|---|---|
| 反映条件 | **main へマージ済み**であること（URLが `/main/` を指すため） |
| 反映速度 | push後おおむね1時間以内 |
| 手編集 | **不可**（式が生成する領域のため） |
| 前提 | **リポジトリが public** であること。private化すると即座に壊れる |

方式Aが動くなら方式Bは不要。**両方を同じタブに使わないこと。**

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
> またはリポジトリの private 化が必要。private 化した場合、方式B（IMPORTDATA）は使えなくなるが、
> **方式A（push-sheet）は影響を受けない。**

`.gsc-token.json` / `.sheet-token.json` / `.env` は `.gitignore` 済み。**絶対にコミットしないこと。**
