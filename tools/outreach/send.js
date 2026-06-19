import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitArg = args.find((a) => a.startsWith('--limit='));
const DAILY_LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : parseInt(process.env.DAILY_LIMIT || '10', 10);

const CSV_PATH = path.join(__dirname, 'list.csv');
const TEMPLATE_PATH = path.join(__dirname, 'template.txt');
const SUBJECT_A_PATH = path.join(__dirname, 'subject.txt');
const SUBJECT_B_PATH = path.join(__dirname, 'subject.b.txt');

const {
  RESEND_API_KEY,
  FROM_NAME = 'ロカサポ事務局',
  FROM_EMAIL = 'info@local-support.jp',
  REPLY_TO = '',
  INTERVAL_SEC = '30',
  JITTER_PCT = '40',
  CAMPAIGN_ID = '',
  SUBJECT_AB = 'true',
} = process.env;

if (!DRY_RUN && !RESEND_API_KEY) {
  console.error('ERROR: RESEND_API_KEY must be set in .env');
  process.exit(1);
}

function todayCampaign() {
  if (CAMPAIGN_ID) return CAMPAIGN_ID;
  const d = new Date();
  return `cold${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function loadCsv() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`ERROR: ${CSV_PATH} not found. Copy list.example.csv to list.csv and fill it.`);
    process.exit(1);
  }
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

function saveCsv(rows) {
  const header = ['facility_name', 'email', 'prefecture', 'facility_type', 'sent_at', 'status', 'note', 'variant'];
  const output = stringify(rows, { header: true, columns: header });
  fs.writeFileSync(CSV_PATH, output, 'utf8');
}

function render(template, row, campaign) {
  return template
    .replace(/\{\{facility_name\}\}/g, row.facility_name || '')
    .replace(/\{\{prefecture\}\}/g, row.prefecture || '貴施設の所在地')
    .replace(/\{\{facility_type\}\}/g, row.facility_type || '施設')
    .replace(/\{\{campaign\}\}/g, campaign);
}

function isValidEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function jitteredDelay(baseMs, jitterPct) {
  const j = Math.max(0, Math.min(80, jitterPct)) / 100;
  const delta = baseMs * j * (Math.random() * 2 - 1);
  return Math.max(1000, Math.round(baseMs + delta));
}

function pickVariant(index, abEnabled) {
  if (!abEnabled) return 'A';
  return index % 2 === 0 ? 'A' : 'B';
}

function categorizeBounce(msg) {
  const m = (msg || '').toLowerCase();
  if (/(invalid|not exist|no such|user unknown|mailbox.*unavailable|550 5\.1\.1)/.test(m)) return 'hard_bounce';
  if (/(quota|full|temporarily|deferred|try again|421)/.test(m)) return 'soft_bounce';
  if (/(spam|policy|blocked|black ?list)/.test(m)) return 'blocked';
  return 'error';
}

async function sendViaResend({ to, subject, text, tags }) {
  const body = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [to],
    subject,
    text,
    tags,
  };
  if (REPLY_TO) body.reply_to = REPLY_TO;

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Resend ${resp.status}: ${errText}`);
  }
  return resp.json();
}

async function main() {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const subjectA = fs.readFileSync(SUBJECT_A_PATH, 'utf8').trim();
  const subjectB = fs.existsSync(SUBJECT_B_PATH)
    ? fs.readFileSync(SUBJECT_B_PATH, 'utf8').trim()
    : subjectA;
  const abEnabled = String(SUBJECT_AB).toLowerCase() === 'true' && subjectA !== subjectB;
  const campaign = todayCampaign();
  const rows = loadCsv();

  const pending = rows.filter((r) => !r.sent_at && r.status !== 'skip' && isValidEmail(r.email));
  const queue = pending.slice(0, DAILY_LIMIT);

  const baseMs = parseInt(INTERVAL_SEC, 10) * 1000;
  const jitterPct = parseInt(JITTER_PCT, 10);

  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no send)' : 'LIVE SEND via Resend'}`);
  console.log(`Total rows: ${rows.length} / Pending: ${pending.length} / Sending now: ${queue.length}`);
  console.log(`From: ${FROM_NAME} <${FROM_EMAIL}>`);
  console.log(`Campaign: ${campaign} / Subject A/B: ${abEnabled ? 'ON' : 'OFF'}`);
  console.log(`Interval: ${INTERVAL_SEC}s ±${jitterPct}% (random jitter)`);
  console.log('---');

  if (queue.length === 0) {
    console.log('Nothing to send. Done.');
    return;
  }

  let sent = 0;
  let failed = 0;
  const stats = { hard_bounce: 0, soft_bounce: 0, blocked: 0, error: 0 };

  for (let i = 0; i < queue.length; i++) {
    const row = queue[i];
    const variant = pickVariant(i, abEnabled);
    const subjectTpl = variant === 'B' ? subjectB : subjectA;
    const subject = render(subjectTpl, row, campaign);
    const text = render(template, row, campaign);

    console.log(`[${i + 1}/${queue.length}] ${row.facility_name} <${row.email}> [${variant}]`);
    console.log(`  Subject: ${subject}`);

    if (DRY_RUN) {
      console.log('  --- BODY PREVIEW ---');
      console.log(text.split('\n').map((l) => '  | ' + l).join('\n'));
      console.log('  --- END ---\n');
      sent++;
      continue;
    }

    try {
      const tags = [
        { name: 'campaign', value: campaign },
        { name: 'variant', value: variant },
      ];
      if (row.prefecture) tags.push({ name: 'pref', value: row.prefecture.replace(/[^\w-]/g, '_').slice(0, 32) });
      const result = await sendViaResend({ to: row.email, subject, text, tags });
      row.sent_at = new Date().toISOString();
      row.status = 'sent';
      row.note = result.id || '';
      row.variant = variant;
      sent++;
      console.log(`  -> sent (id: ${result.id || 'n/a'})\n`);
      saveCsv(rows);
    } catch (err) {
      const cat = categorizeBounce(err.message);
      row.status = cat;
      row.note = err.message.slice(0, 200);
      row.variant = variant;
      failed++;
      stats[cat]++;
      console.log(`  -> FAILED [${cat}]: ${err.message}\n`);
      saveCsv(rows);
    }

    if (i < queue.length - 1) {
      const delay = jitteredDelay(baseMs, jitterPct);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  console.log('---');
  console.log(`Done. sent=${sent} failed=${failed}`);
  if (failed > 0) {
    console.log(`  hard_bounce=${stats.hard_bounce} soft_bounce=${stats.soft_bounce} blocked=${stats.blocked} error=${stats.error}`);
  }
  const bounceRate = sent > 0 ? (stats.hard_bounce / (sent + stats.hard_bounce) * 100).toFixed(1) : '0';
  console.log(`Hard bounce rate: ${bounceRate}% ${parseFloat(bounceRate) > 3 ? '⚠️ 警戒水準（3%超）' : '✅'}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
