#!/usr/bin/env node
/**
 * fetch-gsc.js — Search Console API (OAuth2) → seo-scoring-template.csv 更新
 *
 * ■ セットアップ手順（初回のみ）
 *
 * 1. Google Cloud Console でプロジェクトを選択/作成
 *    https://console.cloud.google.com/
 *
 * 2. 「APIとサービス」→「ライブラリ」→「Google Search Console API」を有効化
 *
 * 3. 「APIとサービス」→「認証情報」→「認証情報を作成」→「OAuth 2.0 クライアント ID」
 *    - アプリケーションの種類：「デスクトップ アプリ」
 *    - 名前は任意（例: local-support-gsc-cli）
 *    - 作成後に表示される「クライアント ID」と「クライアント シークレット」をコピー
 *
 * 4. OAuth 同意画面が「テスト」状態の場合 → テストユーザーに自分のGoogleアカウントを追加
 *
 * 5. .env ファイルを作成（.env.example をコピーして編集）:
 *    GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
 *    GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
 *    GSC_SITE_URL=https://local-support.jp/
 *
 * ■ 初回認証
 *    npm run fetch-gsc
 *    → ブラウザが開く → Google アカウントでログイン → 許可
 *    → トークンが .gsc-token.json に保存される（以降は自動）
 *
 * ■ 通常実行
 *    npm run fetch-gsc              # 前月データで CSV 更新
 *    npm run fetch-gsc:dry          # ドライラン（CSV 更新なし）
 *    npm run fetch-gsc -- --start 2025-05-01 --end 2025-05-31
 */

import { google } from 'googleapis';
import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── 設定 ──────────────────────────────────────────────────────
const SITE_URL    = process.env.GSC_SITE_URL    || 'https://local-support.jp/';
const CLIENT_ID   = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH  = resolve(ROOT, '.gsc-token.json');
const CSV_PATH    = resolve(ROOT, 'docs/seo-scoring-template.csv');
const REDIRECT_PORT = 4242;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;
const SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly'];

// ─── CLI 引数パース ─────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : null;
}

function getPrevMonthRange() {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  const first = new Date(last.getFullYear(), last.getMonth(), 1);
  return {
    start: first.toISOString().slice(0, 10),
    end: last.toISOString().slice(0, 10),
  };
}

const { start: defaultStart, end: defaultEnd } = getPrevMonthRange();
const START_DATE = getArg('--start') || defaultStart;
const END_DATE   = getArg('--end')   || defaultEnd;

console.log(`\n📊 Search Console データ取得`);
console.log(`   期間: ${START_DATE} → ${END_DATE}`);
console.log(`   プロパティ: ${SITE_URL}`);
if (DRY_RUN) console.log(`   ⚠️  ドライラン（CSVは更新しません）`);
console.log('');

// ─── OAuth2 認証 ─────────────────────────────────────────────────
function buildOAuth2Client() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      'GOOGLE_CLIENT_ID または GOOGLE_CLIENT_SECRET が未設定です。\n' +
      '.env ファイルに設定してください（.env.example を参照）。'
    );
  }
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

function loadSavedToken(oauth2) {
  if (!existsSync(TOKEN_PATH)) return false;
  try {
    const token = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'));
    oauth2.setCredentials(token);
    return true;
  } catch {
    return false;
  }
}

function saveToken(oauth2) {
  writeFileSync(TOKEN_PATH, JSON.stringify(oauth2.credentials, null, 2), 'utf8');
}

async function authorizeViaBrowser(oauth2) {
  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('🌐 ブラウザで以下のURLを開いて認証してください:');
  console.log(`\n   ${authUrl}\n`);

  // 自動でブラウザを開く試み
  try {
    const { exec } = await import('child_process');
    const opener =
      process.platform === 'win32' ? `start ""` :
      process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${opener} "${authUrl}"`);
  } catch { /* ブラウザ起動失敗は無視 */ }

  // ローカルサーバーでコールバックを待機
  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.end('<h1>認証が拒否されました</h1><p>ウィンドウを閉じてください。</p>');
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }
      if (code) {
        res.end('<h1>✅ 認証完了！</h1><p>このウィンドウを閉じてターミナルに戻ってください。</p>');
        server.close();
        resolve(code);
      }
    });

    server.listen(REDIRECT_PORT, () => {
      console.log(`⏳ 認証完了を待機中... (localhost:${REDIRECT_PORT})`);
    });

    server.on('error', reject);
    setTimeout(() => { server.close(); reject(new Error('タイムアウト（120秒）')); }, 120_000);
  });

  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);
  saveToken(oauth2);
  console.log('✅ 認証完了！トークンを保存しました。\n');
}

async function getAuthenticatedClient() {
  const oauth2 = buildOAuth2Client();

  if (loadSavedToken(oauth2)) {
    // トークンが期限切れなら自動リフレッシュ
    oauth2.on('tokens', (tokens) => {
      if (tokens.refresh_token) oauth2.credentials.refresh_token ??= tokens.refresh_token;
      oauth2.credentials = { ...oauth2.credentials, ...tokens };
      saveToken(oauth2);
    });
    return oauth2;
  }

  await authorizeViaBrowser(oauth2);
  return oauth2;
}

// ─── CSV ユーティリティ ─────────────────────────────────────────
function parseCSV(raw) {
  const lines = raw.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (cols[i] || '').trim(); });
    return obj;
  });
  return { headers, rows };
}

function serializeCSV(headers, rows) {
  const header = headers.join(',');
  const body = rows.map((row) => headers.map((h) => row[h] ?? '').join(','));
  return [header, ...body].join('\n') + '\n';
}

// ─── スコア計算 ─────────────────────────────────────────────────
function calcScore(row) {
  // 1. インデックス到達速度（10点）
  let s1 = 0;
  if (row['index日'] && row['公開日']) {
    const days = (new Date(row['index日']) - new Date(row['公開日'])) / 86400000;
    s1 = days <= 30 ? 10 : days <= 60 ? 5 : 0;
  }

  // 2. 月間表示回数（20点）
  const imp = parseInt(row['月間表示回数'] || '0', 10);
  const s2 = imp >= 1000 ? 20 : imp >= 500 ? 15 : imp >= 100 ? 10 : imp >= 30 ? 5 : 0;

  // 3. CTR（15点）
  const ctr = parseFloat((row['CTR'] || '0').replace('%', ''));
  const s3 = ctr >= 5 ? 15 : ctr >= 3 ? 10 : ctr >= 1 ? 5 : 0;

  // 4. 平均順位（15点）
  const pos = parseFloat(row['平均順位'] || '999');
  const s4 = pos <= 10 ? 15 : pos <= 20 ? 10 : pos <= 30 ? 5 : 0;

  // 5. AI引用（15点）— 手動入力列
  const ai = (row['AI引用'] || '').toLowerCase();
  const s5 = ai === 'あり' || ai === '1' || ai === 'yes' ? 15 : 0;

  // 6. 問い合わせ率CVR（15点）— GA4連携まで 0
  const cvr = parseFloat((row['問い合わせ率'] || '0').replace('%', ''));
  const s6 = cvr >= 3 ? 15 : cvr >= 1 ? 10 : cvr >= 0.5 ? 5 : 0;

  // 7. 平均滞在時間（10点）— GA4連携まで 0（秒で保存想定）
  const stay = parseFloat(row['平均滞在時間'] || '0');
  const s7 = stay >= 120 ? 10 : stay >= 60 ? 5 : 0;

  return s1 + s2 + s3 + s4 + s5 + s6 + s7;
}

function actionLabel(score) {
  if (score >= 70) return '🥇勝ち筋';
  if (score >= 40) return '🥈改善候補';
  if (score >= 20) return '🥉様子見';
  return '❌撤退候補';
}

// ─── GSC データ取得 ─────────────────────────────────────────────
async function fetchSearchAnalytics(auth) {
  const sc = google.searchconsole({ version: 'v1', auth });
  const res = await sc.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: {
      startDate: START_DATE,
      endDate: END_DATE,
      dimensions: ['page'],
      rowLimit: 25000,
      dataState: 'final',
    },
  });

  const map = new Map();
  for (const row of (res.data.rows || [])) {
    map.set(row.keys[0], {
      impressions: row.impressions || 0,
      clicks: row.clicks || 0,
      ctr: ((row.ctr || 0) * 100).toFixed(2),
      position: (row.position || 0).toFixed(1),
    });
  }
  return map;
}

// ─── メイン ────────────────────────────────────────────────────
async function main() {
  const auth = await getAuthenticatedClient();

  console.log('📡 Search Console API からデータ取得中...');
  const gscData = await fetchSearchAnalytics(auth);
  console.log(`   ${gscData.size} 件のURLデータを取得\n`);

  const raw = readFileSync(CSV_PATH, 'utf8');
  const { headers, rows } = parseCSV(raw);

  let updatedCount = 0;
  for (const row of rows) {
    const url = row['URL'];
    if (!url) continue;

    const d = gscData.get(url);
    if (d) {
      row['月間表示回数'] = String(d.impressions);
      row['CTR']         = `${d.ctr}%`;
      row['平均順位']    = d.position;
      updatedCount++;
    }

    const prev  = parseInt(row['合計点'] || '0', 10);
    const total = calcScore(row);
    row['合計点']  = String(total);
    row['前月差']  = String(total - prev);
    row['アクション'] = actionLabel(total);
  }

  // サマリー
  const scored = rows.filter((r) => r['URL']);
  const byTier = (min, max) =>
    scored.filter((r) => { const s = parseInt(r['合計点'] || '0'); return s >= min && s < max; });

  console.log('═══════════════════════════════════════');
  console.log(`✅ GSC データ更新: ${updatedCount}/${scored.length} URL`);
  console.log('─── スコア分布 ──────────────────────');
  console.log(`🥇 勝ち筋（70+）    : ${byTier(70, Infinity).length} ページ`);
  console.log(`🥈 改善候補（40-69）: ${byTier(40, 70).length} ページ`);
  console.log(`🥉 様子見（20-39）  : ${byTier(20, 40).length} ページ`);
  console.log(`❌ 撤退候補（<20）  : ${byTier(0, 20).length} ページ`);
  console.log('─── TOP 10 ──────────────────────────');

  const top10 = [...scored]
    .sort((a, b) => parseInt(b['合計点']) - parseInt(a['合計点']))
    .slice(0, 10);

  for (const r of top10) {
    const score = parseInt(r['合計点'] || '0');
    const url = r['URL'].replace('https://local-support.jp', '');
    console.log(
      `  ${actionLabel(score)} ${String(score).padStart(3)}pt` +
      `  imp:${(r['月間表示回数'] || '-').padStart(6)}` +
      `  pos:${(r['平均順位'] || '-').padStart(5)}` +
      `  ${url}`
    );
  }
  console.log('═══════════════════════════════════════\n');

  if (!DRY_RUN) {
    writeFileSync(CSV_PATH, serializeCSV(headers, rows), 'utf8');
    console.log(`💾 ${CSV_PATH} を更新しました`);
  } else {
    console.log('（ドライラン: ファイルは更新されていません）');
  }
}

main().catch((err) => {
  console.error('\n❌ エラー:', err.message);
  process.exit(1);
});
