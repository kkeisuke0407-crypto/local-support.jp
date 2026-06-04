# outreach mailer

CSVリスト → テンプレ差し込み → Resend HTTP API で1日N件送るだけの最小ツール。
**HTTPS経由なのでクラウド環境・ローカルどちらでも動く**（SMTPポート不要）。

## セットアップ（初回のみ）

```bash
cd tools/outreach
npm install

# 1) .env を作成
cp .env.example .env
# RESEND_API_KEY を埋める（問い合わせフォームと同じキー）
#   → Cloudflare Pages の環境変数 RESEND_API_KEY と同じ値
#   → または https://resend.com/api-keys で発行

# 2) リストCSVを作成
cp list.example.csv list.csv
# facility_name, email, prefecture, facility_type を埋める
```

## 使い方

```bash
# プレビュー（送信しない・本文を画面表示）
npm run send:dry

# 本番送信（デフォルト1回10件・30秒間隔）
npm run send

# 1回の件数を変える
node send.js --limit=5
```

- 送信後、`list.csv` の `sent_at` と `status` が更新される
- 既に `sent_at` 入りの行は次回スキップ（重複送信防止）
- 失敗時は `status=error` に記録、`note` に理由

## テンプレ編集

- 件名：`subject.txt`
- 本文：`template.txt`
- 差し込み変数：`{{facility_name}}` `{{prefecture}}` `{{facility_type}}`

## 送信の仕組み

- Resend の `https://api.resend.com/emails` に POST（問い合わせフォームと同じ経路）
- From: `info@local-support.jp`（Resendで検証済みドメイン）
- 返信先: `support@local-support.jp`（.env の REPLY_TO で変更可）
- SPF/DKIM/DMARC は Resend 側で処理（SPFに `_spf.resend.com` 設定済み）

## 注意

- 特定電子メール法：**相手サイトに公開されているメアドにのみ送る**
- いきなり大量送信せずウォームアップ（5→10→20→30/日）
- `list.csv` `.env` はgit除外済み
