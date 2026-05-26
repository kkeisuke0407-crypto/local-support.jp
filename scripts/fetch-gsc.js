#!/usr/bin/env node
/**
 * fetch-gsc.js — Search Console API からデータ取得 → seo-scoring-template.csv 更新
 *
 * ■ セットアップ手順（初回のみ）
 *
 * 1. Google Cloud Console でプロジェクトを作成 or 既存プロジェクトを選択
 *    https://console.cloud.google.com/
 *
 * 2. 「APIとサービス」→「ライブラリ」→「Google Search Console API」を有効化
 *
 * 3. 「APIとサービス」→「認証情報」→「認証情報を作成」→「サービス アカウント」
 *    - 任意の名前（例: local-support-gsc）で作成
 *    - ロールは不要（Search Console 側で権限設定するため）
 *    - 作成後、サービスアカウントの「キー」タブ → 「鍵を追加」→「JSON」でダウンロード
 *
 * 4. Search Console (https://search.google.com/search-console/) を開く
 *    - 対象プロパティ「https://local-support.jp/」の設定 → ユーザーと権限
 *    - 「ユーザーを追加」→ サービスアカウントのメール（xxxx@xxx.iam.gserviceaccount.com）を入力
 *    - 権限: 「制限付き」または「フル」
 *
 * 5. .env ファイルを作成（またはシェルで export）:
 *    GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...全JSONの内容...}'
 *    GSC_SITE_URL=https://local-support.jp/
 *
 * ■ 使い方
 *
 *   # 前月データ（デフォルト）
 *   node scripts/fetch-gsc.js
 *
 *   # 日付範囲を指定
 *   node scripts/fetch-gsc.js --start 2025-05-01 --end 2025-05-31
 *
 *   # ドライラン（CSVを更新せずコンソールに表示だけ）
 *   node scripts/fetch-gsc.js --dry-run
 */

import { google } from 'googleapis';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── 設定 ──────────────────────────────────────────────────────
const SITE_URL = process.env.GSC_SITE_URL || 'https://local-support.jp/';
const CSV_PATH = resolve(ROOT, 'docs/seo-scoring-template.csv');

// ─── CLI 引数パース ─────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : null;
}

function getPrevMonthRange() {
  const now = new Date();
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfPrevMonth = new Date(firstOfThisMonth - 1);
  const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1);
  return {
    start: firstOfPrevMonth.toISOString().slice(0, 10),
    end: lastOfPrevMonth.toISOString().slice(0, 10),
  };
}

const { start: defaultStart, end: defaultEnd } = getPrevMonthRange();
const START_DATE = getArg('--start') || defaultStart;
const END_DATE   = getArg('--end')   || defaultEnd;

console.log(`\n📊 Search Console データ取得`);
console.log(`   期間: ${START_DATE} → ${END_DATE}`);
console.log(`   プロパティ: ${SITE_URL}`);
if (DRY_RUN) console.log(`   ⚠️  ドライラン（CSVは更新しません）\n`);

// ─── 認証 ──────────────────────────────────────────────────────
function getAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY が未設定です。\n' +
      '.env ファイルか環境変数に JSON キーを設定してください。\n' +
      'セットアップ方法はこのファイルのコメントを参照してください。'
    );
  }
  const credentials = JSON.parse(keyJson);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
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
  let total = 0;

  // 1. インデックス到達速度（手動設定列 index日 から計算）
  let s1 = 0;
  if (row['index日']) {
    const pubDate = new Date(row['公開日']);
    const idxDate = new Date(row['index日']);
    if (!isNaN(pubDate) && !isNaN(idxDate)) {
      const days = (idxDate - pubDate) / 86400000;
      s1 = days <= 30 ? 10 : days <= 60 ? 5 : 0;
    }
  }

  // 2. 月間表示回数（20点）
  const imp = parseInt(row['月間表示回数'] || '0', 10);
  const s2 = imp >= 1000 ? 20 : imp >= 500 ? 15 : imp >= 100 ? 10 : imp >= 30 ? 5 : 0;

  // 3. CTR（15点）
  const ctrStr = (row['CTR'] || '0').replace('%', '');
  const ctr = parseFloat(ctrStr);
  const s3 = ctr >= 5 ? 15 : ctr >= 3 ? 10 : ctr >= 1 ? 5 : 0;

  // 4. 平均順位（15点）
  const pos = parseFloat(row['平均順位'] || '999');
  const s4 = pos <= 10 ? 15 : pos <= 20 ? 10 : pos <= 30 ? 5 : 0;

  // 5. AI引用（15点）— 手動列をそのまま使用
  const aiCite = (row['AI引用'] || '').toLowerCase();
  const s5 = aiCite === 'あり' || aiCite === '1' || aiCite === 'yes' ? 15 : 0;

  // 6. 問い合わせ率CVR（15点）— GA4連携まで 0
  const cvrStr = (row['問い合わせ率'] || '0').replace('%', '');
  const cvr = parseFloat(cvrStr);
  const s6 = cvr >= 3 ? 15 : cvr >= 1 ? 10 : cvr >= 0.5 ? 5 : 0;

  // 7. 平均滞在時間（10点）— GA4連携まで 0（秒で保存想定）
  const stay = parseFloat(row['平均滞在時間'] || '0');
  const s7 = stay >= 120 ? 10 : stay >= 60 ? 5 : 0;

  total = s1 + s2 + s3 + s4 + s5 + s6 + s7;
  return { total, s1, s2, s3, s4, s5, s6, s7 };
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
    const url = row.keys[0];
    map.set(url, {
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
  const auth = getAuth();

  console.log('🔑 認証中...');
  const client = await auth.getClient();
  google.options({ auth: client });

  console.log('📡 Search Console API からデータ取得中...');
  const gscData = await fetchSearchAnalytics(client);
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
      row['CTR'] = `${d.ctr}%`;
      row['平均順位'] = d.position;
      updatedCount++;
    }

    // スコア再計算
    const { total } = calcScore(row);
    const prev = parseInt(row['合計点'] || '0', 10);
    row['合計点'] = String(total);
    row['前月差'] = String(total - prev);
    row['アクション'] = actionLabel(total);
  }

  // サマリー表示
  const scored = rows.filter((r) => r['URL']);
  const winners = scored.filter((r) => parseInt(r['合計点'] || '0') >= 70);
  const improvers = scored.filter((r) => {
    const s = parseInt(r['合計点'] || '0');
    return s >= 40 && s < 70;
  });
  const watchers = scored.filter((r) => {
    const s = parseInt(r['合計点'] || '0');
    return s >= 20 && s < 40;
  });
  const retreats = scored.filter((r) => parseInt(r['合計点'] || '0') < 20);

  console.log('═══════════════════════════════════════');
  console.log(`✅ GSC データ更新: ${updatedCount}/${scored.length} URL`);
  console.log('─── スコア分布 ──────────────────────');
  console.log(`🥇 勝ち筋（70+）    : ${winners.length} ページ`);
  console.log(`🥈 改善候補（40-69）: ${improvers.length} ページ`);
  console.log(`🥉 様子見（20-39）  : ${watchers.length} ページ`);
  console.log(`❌ 撤退候補（<20）  : ${retreats.length} ページ`);
  console.log('─── TOP 10 ──────────────────────────');

  const top10 = [...scored]
    .sort((a, b) => parseInt(b['合計点']) - parseInt(a['合計点']))
    .slice(0, 10);

  for (const r of top10) {
    const score = parseInt(r['合計点'] || '0');
    const imp = r['月間表示回数'] || '-';
    const pos = r['平均順位'] || '-';
    const url = r['URL'].replace('https://local-support.jp', '');
    console.log(`  ${actionLabel(score)} ${score}pt  imp:${imp}  pos:${pos}  ${url}`);
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
