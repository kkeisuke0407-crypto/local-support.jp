# quote-url generator

業者比較ページ（`/quote-result/`）のURLを生成するツール。
業者の見積もりデータをURLハッシュに base64 で埋め込むため、サーバー側のストレージは不要。

## 仕組み

```
[依頼受付] → [運営が業者3〜5社を選定・見積取得]
　　　↓
[このツールでURL生成] → [依頼者にメール送信]
　　　↓
[依頼者が比較ページで業者を選択（1〜3社）]
　　　↓
[/api/select-vendor へPOST] → [運営に選定通知 + 依頼者に確認メール]
　　　↓
[運営が選定業者へ連絡先共有・紹介プロセス開始]
```

## 使い方

```bash
# 1) sample.json をコピー
cp sample.json my-request.json

# 2) my-request.json を編集（業者情報・依頼者情報を入れる）

# 3) URL生成
node generate.mjs my-request.json

# ローカル開発で確認したい場合
node generate.mjs my-request.json --domain=http://localhost:4321
```

出力されたURLを依頼者にメールで送る。

## データ仕様

```jsonc
{
  "id": "PCO-2026-0619-001",          // 案件ID（必須）
  "service": "害虫駆除（業務用PCO）",   // サービス名（必須）
  "prefecture": "福岡県",              // 地域
  "requester": {
    "name": "海潤貿易株式会社",
    "email": "...@kaijunboeki.co.jp",  // 確認メール送信先
    "tel": "070-xxxx-xxxx"
  },
  "createdAt": "2026-06-19",
  "expiresAt": "2026-06-30",
  "vendors": [                          // 1〜5社（必須）
    {
      "id": "v1",                        // 業者ID（重複しない）
      "name": "A社（福岡市内）",
      "estimatedPrice": "月額 14,000円〜18,000円",
      "annualPrice": "年額 168,000円〜216,000円",
      "credentials": [
        "公益社団法人 福岡県ペストコントロール協会 会員",
        "防除作業監督者 2名在籍"
      ],
      "experience": "PCO実績 15年・県内800件",
      "haccp": "対応可",
      "responseTime": "翌営業日対応",
      "proposal": "...IPMを基本とした提案文",
      "highlights": ["近距離（同市内）", "報告書品質高", "緊急対応24時間"]
    }
  ]
}
```

### 必須項目
- `id`, `service`, `vendors[].name`

### 推奨項目（あると依頼者の判断材料になる）
- `estimatedPrice`：見積もり金額
- `credentials`：資格・登録（信頼性訴求）
- `proposal`：提案概要（差別化ポイント）
- `highlights`：要点タグ（一覧で目を引く）

## 注意

- URL長は **6,000文字以下** が目安（メールクライアントの折り返し対策）
- 6,000文字を超える場合は警告が出る → `proposal` や `credentials` を簡潔化
- URLハッシュはサーバーに送信されない（プライバシー上のメリット）が、依頼者本人以外には共有しないようご案内
- 業者の連絡先情報は**URLに含めない**（依頼者の選定後に運営が個別に共有する）
