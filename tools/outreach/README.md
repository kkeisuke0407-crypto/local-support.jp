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

# 本番送信（DAILY_LIMITに従う・間隔ジッター付き）
npm run send

# 1回の件数を変える
node send.js --limit=50
```

- 送信後、`list.csv` の `sent_at` `status` `variant` が更新される
- 既に `sent_at` 入りの行は次回スキップ（重複送信防止）
- 失敗時は `status` に分類が記録される（hard_bounce / soft_bounce / blocked / error）

## ランプアップ計画（バウンス率1〜2%以下が前提）

| 週 | DAILY_LIMIT | 注意点 |
|---|---|---|
| Week 1 | 30/日 | 現状維持。バウンス率と返信率を計測 |
| Week 2 | 50/日 | パーソナライズ（{{prefecture}} {{facility_type}}）を本文で使う |
| Week 3 | 80/日 | A/B件名で開封率を計測（subject.b.txt） |
| Week 4 | 120/日 | 配信時刻を分散（朝・昼の2回に分けて実行） |
| Week 5+ | 150-200/日 | Google Postmaster Tools で local-support.jp の評価をリアルタイム監視 |

**監視シグナル（即減速ライン）**:
- ハードバウンス率 > 3% → リスト精査
- スパム苦情率 > 0.1% → 文面・頻度を見直し
- 開封率 < 5% → 件名と送信元名を見直し
- Resend ダッシュボードで spam complaints > 0 → 即停止

## テンプレ編集

- 件名（A）：`subject.txt`
- 件名（B・A/B用）：`subject.b.txt`（同一なら A/B 自動 OFF）
- 本文：`template.txt`
- 差し込み変数：`{{facility_name}}` `{{prefecture}}` `{{facility_type}}` `{{campaign}}`

## 送信の仕組み

- Resend の `https://api.resend.com/emails` に POST（問い合わせフォームと同じ経路）
- From: `info@local-support.jp`（Resendで検証済みドメイン）
- 返信先: `support@local-support.jp`（.env の REPLY_TO で変更可）
- SPF/DKIM/DMARC は Resend 側で処理（SPFに `_spf.resend.com` 設定済み）
- Resend Tags（campaign / variant / pref）で配信ダッシュボードでセグメント分析可能
- 間隔は `INTERVAL_SEC ± JITTER_PCT%` のランダムジッター付き（ロボット検知回避）

## 注意

- 特定電子メール法：**相手サイトに公開されているメアドにのみ送る**
- 配信解除導線：テンプレ末尾の「ご不要の場合はご返信ください」を維持
- `list.csv` `.env` はgit除外済み
- A/B件名は偶数行=A、奇数行=B で交互に割り当て（簡易ABテスト）
