-- ============================================================
-- local-support.jp アウトバウンド送客エンジン CRMスキーマ
-- SQLite互換（MVP）。PostgreSQLへもほぼそのまま移行可能。
--   - SQLite: INTEGER PRIMARY KEY = autoincrement
--   - Postgres移行時: INTEGER PRIMARY KEY → BIGSERIAL / GENERATED ALWAYS AS IDENTITY、
--     TEXT日時 → TIMESTAMPTZ に置換
-- ============================================================

-- ── 法人マスタ＋エンリッチ＋スコア ──────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id                     INTEGER PRIMARY KEY,
  corporate_number       TEXT UNIQUE,             -- 国税庁 法人番号(13桁)・重複排除キー
  company_name           TEXT NOT NULL,
  website_url            TEXT,
  contact_email          TEXT,                    -- ★最優先取得項目
  email_source           TEXT,                    -- website / directory / manual
  email_is_personal      INTEGER DEFAULT 0,       -- 0/1
  contact_form_url       TEXT,
  phone                  TEXT,
  address                TEXT,
  prefecture             TEXT,
  city                   TEXT,
  segment                TEXT NOT NULL,           -- TargetSegment (scoring.ts)
  industry               TEXT,
  employee_count         INTEGER,
  managed_property_count INTEGER,
  facility_count         INTEGER,
  score                  INTEGER,                 -- 0..100
  score_reasons          TEXT,                    -- JSON配列文字列
  contact_channel        TEXT,                    -- email / form / hold
  robots_allowed         INTEGER DEFAULT 1,       -- スクレイピング可否
  sales_refused          INTEGER DEFAULT 0,       -- 「営業お断り」明記
  source                 TEXT,                    -- データ取得元
  collected_at           TEXT,
  updated_at             TEXT,
  crm_status             TEXT NOT NULL DEFAULT '未送信'
  -- 未送信/送信済み/返信あり/興味あり/見積依頼/商談中/失注/要確認/配信停止/バウンス
);
CREATE INDEX IF NOT EXISTS idx_companies_status   ON companies(crm_status);
CREATE INDEX IF NOT EXISTS idx_companies_score    ON companies(score DESC);
CREATE INDEX IF NOT EXISTS idx_companies_segment  ON companies(segment);
CREATE INDEX IF NOT EXISTS idx_companies_pref     ON companies(prefecture);
CREATE INDEX IF NOT EXISTS idx_companies_channel  ON companies(contact_channel);

-- ── アウトリーチ（送信履歴：メール / フォーム共通） ──────────
CREATE TABLE IF NOT EXISTS outreach_messages (
  id                  INTEGER PRIMARY KEY,
  company_id          INTEGER NOT NULL REFERENCES companies(id),
  channel             TEXT NOT NULL,              -- email / form
  direction           TEXT NOT NULL DEFAULT 'outbound',
  subject             TEXT,                       -- メール件名（AI生成）
  body                TEXT,                       -- 本文（AI生成）
  status              TEXT NOT NULL DEFAULT 'draft',
  -- draft → approved → queued → sent / failed
  --   form例外: needs_review (CAPTCHA/画像/SMS/営業禁止)
  --   返信検知: replied
  provider_message_id TEXT,                       -- ESPのメッセージID
  approved_by         TEXT,                       -- 人間レビュー者
  approved_at         TEXT,
  sent_at             TEXT,
  error_detail        TEXT,                       -- 失敗/要確認の理由
  created_at          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_msg_company ON outreach_messages(company_id);
CREATE INDEX IF NOT EXISTS idx_msg_status  ON outreach_messages(status);

-- ── 反応イベント（開封/クリック/返信/バウンス/配信停止 等） ──
CREATE TABLE IF NOT EXISTS message_events (
  id          INTEGER PRIMARY KEY,
  message_id  INTEGER REFERENCES outreach_messages(id),
  company_id  INTEGER REFERENCES companies(id),
  event_type  TEXT NOT NULL,
  -- delivered / open / click / reply / bounce / complaint / unsubscribe
  detail      TEXT,
  occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_event_company ON message_events(company_id);
CREATE INDEX IF NOT EXISTS idx_event_type    ON message_events(event_type);

-- ── 配信停止・バウンス（suppression list：再送信防止） ───────
CREATE TABLE IF NOT EXISTS suppression (
  id         INTEGER PRIMARY KEY,
  email      TEXT,
  domain     TEXT,
  reason     TEXT NOT NULL,              -- unsubscribe / hard_bounce / complaint / manual
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppression_email ON suppression(email);

-- ── CRMステータス変更ログ（監査・ファネル分析用） ────────────
CREATE TABLE IF NOT EXISTS crm_status_log (
  id          INTEGER PRIMARY KEY,
  company_id  INTEGER NOT NULL REFERENCES companies(id),
  from_status TEXT,
  to_status   TEXT NOT NULL,
  note        TEXT,
  changed_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_statuslog_company ON crm_status_log(company_id);

-- ── 送客（local-support.jp の見積依頼に繋がった記録） ────────
CREATE TABLE IF NOT EXISTS referrals (
  id           INTEGER PRIMARY KEY,
  company_id   INTEGER NOT NULL REFERENCES companies(id),
  service_slug TEXT,                     -- jusuisou-seisou / shobo-setsubi 等
  quote_ref    TEXT,                     -- /api/quote 側の参照ID
  referred_at  TEXT NOT NULL,
  note         TEXT
);
CREATE INDEX IF NOT EXISTS idx_referrals_company ON referrals(company_id);

-- ============================================================
-- ファネル分析の例（送客数最大化のKPI可視化）
--   SELECT crm_status, COUNT(*) FROM companies GROUP BY crm_status;
--   送信→返信率: message_events(reply) / outreach_messages(sent)
--   送客数:       SELECT COUNT(*) FROM referrals;
-- ============================================================
