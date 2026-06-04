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
const SUBJECT_PATH = path.join(__dirname, 'subject.txt');

const {
  RESEND_API_KEY,
  FROM_NAME = 'ロカサポ事務局',
  FROM_EMAIL = 'info@local-support.jp',
  REPLY_TO = '',
  INTERVAL_SEC = '30',
} = process.env;

if (!DRY_RUN && !RESEND_API_KEY) {
  console.error('ERROR: RESEND_API_KEY must be set in .env');
  process.exit(1);
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
  const header = ['facility_name', 'email', 'prefecture', 'facility_type', 'sent_at', 'status', 'note'];
  const output = stringify(rows, { header: true, columns: header });
  fs.writeFileSync(CSV_PATH, output, 'utf8');
}

function render(template, row) {
  return template
    .replace(/\{\{facility_name\}\}/g, row.facility_name || '')
    .replace(/\{\{prefecture\}\}/g, row.prefecture || '')
    .replace(/\{\{facility_type\}\}/g, row.facility_type || '');
}

function isValidEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function sendViaResend({ to, subject, text }) {
  const body = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [to],
    subject,
    text,
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
  const subjectTemplate = fs.readFileSync(SUBJECT_PATH, 'utf8').trim();
  const rows = loadCsv();

  const pending = rows.filter((r) => !r.sent_at && r.status !== 'skip' && isValidEmail(r.email));
  const queue = pending.slice(0, DAILY_LIMIT);

  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no send)' : 'LIVE SEND via Resend'}`);
  console.log(`Total rows: ${rows.length} / Pending: ${pending.length} / Sending now: ${queue.length}`);
  console.log(`From: ${FROM_NAME} <${FROM_EMAIL}>`);
  console.log(`Interval: ${INTERVAL_SEC}s between sends`);
  console.log('---');

  if (queue.length === 0) {
    console.log('Nothing to send. Done.');
    return;
  }

  let sent = 0;
  let failed = 0;
  const intervalMs = parseInt(INTERVAL_SEC, 10) * 1000;

  for (let i = 0; i < queue.length; i++) {
    const row = queue[i];
    const subject = render(subjectTemplate, row);
    const text = render(template, row);

    console.log(`[${i + 1}/${queue.length}] ${row.facility_name} <${row.email}>`);
    console.log(`  Subject: ${subject}`);

    if (DRY_RUN) {
      console.log('  --- BODY PREVIEW ---');
      console.log(text.split('\n').map((l) => '  | ' + l).join('\n'));
      console.log('  --- END ---\n');
      sent++;
      continue;
    }

    try {
      const result = await sendViaResend({ to: row.email, subject, text });
      row.sent_at = new Date().toISOString();
      row.status = 'sent';
      row.note = result.id || '';
      sent++;
      console.log(`  -> sent (id: ${result.id || 'n/a'})\n`);
      saveCsv(rows);
    } catch (err) {
      row.status = 'error';
      row.note = err.message.slice(0, 200);
      failed++;
      console.log(`  -> FAILED: ${err.message}\n`);
      saveCsv(rows);
    }

    if (i < queue.length - 1) {
      await new Promise((res) => setTimeout(res, intervalMs));
    }
  }

  console.log('---');
  console.log(`Done. sent=${sent} failed=${failed}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
