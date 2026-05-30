# 営業リスト CSVスキーマ（エクスポート形式）

> リストの「真のソース」はCRM DB（`crm.sql`）。本CSVはその**エクスポート/取り込み形式**。
> 文字コード **UTF-8 (BOM付き推奨：Excel対応)**、区切り **カンマ**、1行目ヘッダ。
> 配列項目（`score_reasons`）はセル内で ` / ` 区切り、または JSON文字列。

| # | 列名 | 必須 | 型 | 例 | 説明 |
|---|---|---|---|---|---|
| 1 | `id` | ○ | int | `1024` | CRM内部ID |
| 2 | `corporate_number` | △ | string(13) | `1010001000001` | 国税庁 法人番号（重複排除キー） |
| 3 | `company_name` | ○ | string | `〇〇managementマネジメント株式会社` | 会社名 |
| 4 | `website_url` | △ | url | `https://example.co.jp/` | 企業URL |
| 5 | `contact_email` | △ | email | `info@example.co.jp` | **問い合わせ用メール（最優先取得項目）** |
| 6 | `email_source` | △ | enum | `website` | 取得元：`website`/`directory`/`manual` |
| 7 | `email_is_personal` | △ | bool | `false` | 個別担当アドレスか（info@等=false） |
| 8 | `contact_form_url` | △ | url | `https://example.co.jp/contact/` | 問い合わせフォームURL |
| 9 | `phone` | △ | string | `03-1234-5678` | 電話番号 |
| 10 | `address` | △ | string | `東京都千代田区…` | 所在地（全体） |
| 11 | `prefecture` | △ | string | `東京都` | 都道府県（地域スコア用） |
| 12 | `city` | △ | string | `千代田区` | 市区町村 |
| 13 | `segment` | ○ | enum | `mansion_kanri` | ターゲット区分（scoring.ts の TargetSegment） |
| 14 | `industry` | △ | string | `マンション管理業` | 業種（表示用） |
| 15 | `employee_count` | △ | int | `120` | 従業員数（取得可能な場合） |
| 16 | `managed_property_count` | △ | int | `350` | 管理物件数（取得可能な場合） |
| 17 | `facility_count` | △ | int | `15` | 運営施設数（介護/商業等） |
| 18 | `score` | ○ | int(0-100) | `83` | スコア（computeScore） |
| 19 | `score_reasons` | ○ | string | `+30 マンション管理会社 / +24 問い合わせメールあり / …` | スコア理由 |
| 20 | `contact_channel` | ○ | enum | `email` | 推奨経路：`email`/`form`/`hold` |
| 21 | `robots_allowed` | △ | bool | `true` | robots.txt上スクレイピング可否 |
| 22 | `source` | △ | string | `法人番号API+公式サイト` | データ取得元 |
| 23 | `collected_at` | ○ | ISO8601 | `2026-05-30T10:00:00+09:00` | 収集日時 |
| 24 | `crm_status` | ○ | enum | `未送信` | CRMステータス（下記） |
| 25 | `notes` | △ | string | `本社一括契約の可能性` | 自由記述 |

## enum 定義

- **segment**：`mansion_kanri` / `fudosan_kanri` / `shogyo_shisetsu` / `kaigo` / `byoin` / `clinic` / `bilmen` / `other`
- **contact_channel**：`email`（メール送信） / `form`（フォーム入力→送信前停止→人間確認） / `hold`（保留・要確認）
- **email_source**：`website` / `directory`（公開名簿） / `manual`
- **crm_status**：`未送信` / `送信済み` / `返信あり` / `興味あり` / `見積依頼` / `商談中` / `失注` / `要確認` / `配信停止` / `バウンス`

## ヘッダ行（コピー用）

```csv
id,corporate_number,company_name,website_url,contact_email,email_source,email_is_personal,contact_form_url,phone,address,prefecture,city,segment,industry,employee_count,managed_property_count,facility_count,score,score_reasons,contact_channel,robots_allowed,source,collected_at,crm_status,notes
```

> 注意：本ファイルは**スキーマ定義**です。実在企業のデータは含みません。
> 実データは収集ツール（次フェーズ実装）が公的DB＋公式サイトから取得し、
> `computeScore()` を通して `score`/`score_reasons`/`contact_channel` を埋めます。
</content>
