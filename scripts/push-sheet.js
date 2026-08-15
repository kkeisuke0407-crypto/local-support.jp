#!/usr/bin/env node
/**
 * push-sheet.js — docs/sheet-tab*.csv → Googleスプレッドシート「ロカサポ 案件トラッカー」へ書き込み
 *
 * 案件トラッカーの手動インポートを廃止するためのスクリプト。
 * fetch-gsc.js と同じ OAuth2 + 暗号化トークン保存の仕組みを流用している。
 *
 * ■ セットアップ（初回のみ）
 *
 * 1. Google Cloud Console → 「APIとサービス」→「ライブラリ」→
 *    **Google Sheets API** を有効化（Search Console API とは別に必要）
 *
 * 2. .env は fetch-gsc.js と共通のものを使う（GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET）。
 *    スプシIDだけ追加する:
 *      SHEET_ID=1Zdt7d8luN6o4D9YgQwZ0D2kGRwew5uLtdY8pdZynrqg
 *
 * 3. 初回認証（トークンは .sheet-token.json に暗号化保存。GSC用とはスコープが違うため別ファイル）
 *      npm run push-sheet:auth     # クラウド／ブラウザが開けない環境（コード貼り付け方式）
 *      npm run push-sheet          # ローカル（ブラウザが自動で開く）
 *
 *    ※ 認証は**スプレッドシートの所有者アカウント（support@local-support.jp）**で行うこと。
 *      別アカウントで認証すると「Requested entity was not found」になる。
 *
 * ■ 通常実行
 *      npm run push-sheet          # 2タブを最新CSVで置き換え
 *      npm run push-sheet:dry      # 差分だけ表示して書き込まない
 *
 * ■ 仕様
 *  - `依頼者` タブ ← docs/sheet-tab1-cases.csv
 *  - `業者`   タブ ← docs/sheet-tab2-quotes.csv
 *  - 書き込みは valueInputOption='RAW'。日付が 46192 のようなシリアル値に化けるのを防ぐ
 *  - 書き込み前に既存範囲を clear するため、行数が減っても古い行が残らない
 *  - タブが存在しない場合は自動で作成する
 */

import 'dotenv/config';
import { google } from 'googleapis';
import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, chmodSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── CLI 引数 ──────────────────────────────────────────────────
const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const MANUAL  = args.includes('--manual');

// ─── 設定 ──────────────────────────────────────────────────────
const SHEET_ID      = process.env.SHEET_ID || '1Zdt7d8luN6o4D9YgQwZ0D2kGRwew5uLtdY8pdZynrqg';
const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH    = resolve(ROOT, '.sheet-token.json');
const REDIRECT_PORT       = 4243;
const REDIRECT_URI_AUTO   = `http://localhost:${REDIRECT_PORT}/callback`;
const REDIRECT_URI_MANUAL = 'http://localhost';
const REDIRECT_URI  = MANUAL ? REDIRECT_URI_MANUAL : REDIRECT_URI_AUTO;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// タブ名 → seed CSV
const TABS = [
  { title: '依頼者', csv: resolve(ROOT, 'docs/sheet-tab1-cases.csv') },
  { title: '業者',   csv: resolve(ROOT, 'docs/sheet-tab2-quotes.csv') },
];

let ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️  TOKEN_ENCRYPTION_KEY が未設定のためランダム生成しました。');
  console.warn('   毎回変わると保存済みトークンを復号できません。.env に固定してください:\n');
  console.warn(`   TOKEN_ENCRYPTION_KEY=${ENCRYPTION_KEY}\n`);
}

// ─── トークン暗号化（fetch-gsc.js と同方式）─────────────────────
function encryptToken(token) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(token), 'utf8'), cipher.final()]);
  return JSON.stringify({ iv: iv.toString('hex'), data: encrypted.toString('hex') });
}

function decryptToken(encryptedData) {
  try {
    const { iv, data } = JSON.parse(encryptedData);
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch {
    throw new Error('トークンの復号に失敗しました。TOKEN_ENCRYPTION_KEY が変わっている可能性があります。');
  }
}

// ─── OAuth2 ────────────────────────────────────────────────────
function buildOAuth2Client() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      'GOOGLE_CLIENT_ID または GOOGLE_CLIENT_SECRET が未設定です。\n' +
      '.env に設定してください（.env.example を参照）。'
    );
  }
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

function loadSavedToken(oauth2) {
  if (!existsSync(TOKEN_PATH)) return false;
  try {
    oauth2.setCredentials(decryptToken(readFileSync(TOKEN_PATH, 'utf8')));
    return true;
  } catch (err) {
    console.error('保存済みトークンの読み込みに失敗:', err.message);
    return false;
  }
}

function saveToken(oauth2) {
  writeFileSync(TOKEN_PATH, encryptToken(oauth2.credentials), 'utf8');
  try { chmodSync(TOKEN_PATH, 0o600); } catch { /* Windows は無視 */ }
}

async function authorizeViaBrowser(oauth2) {
  const authUrl = oauth2.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
  console.log('🌐 ブラウザで以下のURLを開いて認証してください:');
  console.log(`\n   ${authUrl}\n`);
  try {
    const { exec } = await import('child_process');
    const opener = process.platform === 'win32' ? 'start ""' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${opener} "${authUrl}"`);
  } catch { /* 起動失敗は無視 */ }

  const code = await new Promise((res, rej) => {
    const server = createServer((req, resp) => {
      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
      const c = url.searchParams.get('code');
      const e = url.searchParams.get('error');
      if (e) { resp.end('<h1>認証が拒否されました</h1>'); server.close(); rej(new Error(`OAuth error: ${e}`)); return; }
      if (c) { resp.end('<h1>✅ 認証完了！このウィンドウを閉じてください。</h1>'); server.close(); res(c); }
    });
    server.listen(REDIRECT_PORT, () => console.log(`⏳ 認証完了を待機中... (localhost:${REDIRECT_PORT})`));
    server.on('error', rej);
    setTimeout(() => { server.close(); rej(new Error('タイムアウト（120秒）')); }, 120_000);
  });

  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);
  saveToken(oauth2);
  console.log('✅ 認証完了！トークンを保存しました。\n');
}

async function authorizeManual(oauth2) {
  const authUrl = oauth2.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
  console.log('─────────────────────────────────────────────────');
  console.log('🌐 【手順1】ブラウザで以下のURLを開いてください:');
  console.log('');
  console.log(`   ${authUrl}`);
  console.log('');
  console.log('【手順2】スプシの所有者アカウント（support@local-support.jp）でログインし「許可」');
  console.log('【手順3】リダイレクト先（接続できないページ）のURLから');
  console.log('        「code=」の値をコピーしてください');
  console.log('');
  console.log('  例: http://localhost/?code=4/0AX4XfW...&scope=...');
  console.log('                              ↑ ここからコピー');
  console.log('─────────────────────────────────────────────────');
  process.stdout.write('\n認証コードを貼り付けてください: ');

  const code = await new Promise((res) => {
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (d) => res(d.trim()));
  });

  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);
  saveToken(oauth2);
  console.log('\n✅ 認証完了！トークンを保存しました。\n');
}

async function getAuthenticatedClient() {
  const oauth2 = buildOAuth2Client();
  if (loadSavedToken(oauth2)) {
    oauth2.on('tokens', (tokens) => {
      if (tokens.refresh_token) oauth2.credentials.refresh_token ??= tokens.refresh_token;
      oauth2.credentials = { ...oauth2.credentials, ...tokens };
      saveToken(oauth2);
    });
    return oauth2;
  }
  if (MANUAL) await authorizeManual(oauth2);
  else await authorizeViaBrowser(oauth2);
  return oauth2;
}

// ─── CSV パース（引用符・改行入りフィールド対応）────────────────
function parseCSV(raw) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  const text = raw.replace(/\r\n/g, '\n').replace(/\n+$/, '');

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += ch;
  }
  row.push(field);
  rows.push(row);
  return rows.filter((r) => r.some((c) => c !== ''));
}

function colLetter(n) {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// ─── メイン ────────────────────────────────────────────────────
async function main() {
  console.log('\n📤 案件トラッカーへの書き込み');
  console.log(`   スプシID: ${SHEET_ID}`);
  if (DRY_RUN) console.log('   ⚠️  ドライラン（書き込みません）');
  console.log('');

  // 先にCSVを読んで検証（認証前に落とす）
  const payloads = TABS.map(({ title, csv }) => {
    if (!existsSync(csv)) throw new Error(`CSVが見つかりません: ${csv}`);
    const rows = parseCSV(readFileSync(csv, 'utf8'));
    const width = rows[0].length;
    const bad = rows.map((r, i) => [i + 1, r.length]).filter(([, len]) => len !== width);
    if (bad.length) {
      throw new Error(
        `${csv} の列数が不揃いです（ヘッダ ${width} 列）: ` +
        bad.map(([line, len]) => `${line}行目=${len}列`).join(', ')
      );
    }
    return { title, csv, rows, width };
  });

  for (const p of payloads) {
    console.log(`   ${p.title.padEnd(4)} ← ${p.csv.replace(ROOT + '/', '')}  (${p.rows.length - 1}行 × ${p.width}列)`);
  }
  console.log('');

  if (DRY_RUN) {
    console.log('（ドライラン: 認証・書き込みは行いません）');
    return;
  }

  const auth = await getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });

  // 既存タブを確認し、無ければ作る
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existing = new Set(meta.data.sheets.map((s) => s.properties.title));
  console.log(`📗 「${meta.data.properties.title}」に接続`);
  console.log(`   既存タブ: ${[...existing].join(' / ')}\n`);

  const missing = payloads.filter((p) => !existing.has(p.title));
  if (missing.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: missing.map((p) => ({ addSheet: { properties: { title: p.title } } })),
      },
    });
    console.log(`➕ タブを作成: ${missing.map((p) => p.title).join(' / ')}\n`);
  }

  for (const p of payloads) {
    // 古い行が残らないよう、先にタブ全体をクリア
    await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `'${p.title}'` });

    const range = `'${p.title}'!A1:${colLetter(p.width)}${p.rows.length}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range,
      // RAW にしないと 2026-06-19 が 46192 のようなシリアル値に変換される
      valueInputOption: 'RAW',
      requestBody: { values: p.rows },
    });
    console.log(`✅ ${p.title} を更新（${p.rows.length - 1}行）`);
  }

  console.log(`\n🔗 https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit\n`);
}

main().catch((err) => {
  console.error('\n❌ エラー:', err.message);
  if (/not found|見つかりません/i.test(err.message)) {
    console.error('   → スプシIDが正しいか、認証したアカウントに編集権限があるか確認してください。');
    console.error('      所有者は support@local-support.jp です。');
  }
  if (/Sheets API has not been used|accessNotConfigured/i.test(err.message)) {
    console.error('   → Google Cloud Console で **Google Sheets API** を有効化してください。');
  }
  if (/insufficient|scope/i.test(err.message)) {
    console.error('   → スコープ不足です。.sheet-token.json を削除して再認証してください。');
  }
  process.exit(1);
});
