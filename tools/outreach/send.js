import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitArg = args.find((a) => a.startsWith('--limit='));
const DAILY_LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : parseInt(process.env.DAILY_LIMIT || '10', 10);

const CSV_PATH = path.join(__dirname, 'list.csv');
const TEMPLATE_PATH = path.join(__dirname, 'template.txt');
const SUBJECT_PATH = path.join(__dirname, 'subject.txt');

const {
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
  FROM_NAME = 'ロカサポ事務局',
  FROM_EMAIL = 'info@local-support.jp',
  INTERVAL_SEC = '30',
} = process.env;

if (!DRY_RUN) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error('ERROR: GMAIL_USER and GMAIL_APP_PASSWORD must be set in .env');
    process.exit(1);
  }
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

async function main() {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const subjectTemplate = fs.readFileSync(SUBJECT_PATH, 'utf8').trim();
  const rows = loadCsv();

  const pending = rows.filter((r) => !r.sent_at && r.status !== 'skip' && isValidEmail(r.email));
  const queue = pending.slice(0, DAILY_LIMIT);

  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no send)' : 'LIVE SEND'}`);
  console.log(`Total rows: ${rows.length} / Pending: ${pending.length} / Sending now: ${queue.length}`);
  console.log(`From: ${FROM_NAME} <${FROM_EMAIL}>`);
  console.log(`Interval: ${INTERVAL_SEC}s between sends`);
  console.log('---');

  if (queue.length === 0) {
    console.log('Nothing to send. Done.');
    return;
  }

  let transporter = null;
  if (!DRY_RUN) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
    try {
      await transporter.verify();
      console.log('SMTP connection OK\n');
    } catch (err) {
      console.error('SMTP verification failed:', err.message);
      process.exit(1);
    }
  }

  let sent = 0;
  let failed = 0;
  const intervalMs = parseInt(INTERVAL_SEC, 10) * 1000;

  for (let i = 0; i < queue.length; i++) {
    const row = queue[i];
    const subject = render(subjectTemplate, row);
    const body = render(template, row);

    console.log(`[${i + 1}/${queue.length}] ${row.facility_name} <${row.email}>`);
    console.log(`  Subject: ${subject}`);

    if (DRY_RUN) {
      console.log('  --- BODY PREVIEW ---');
      console.log(body.split('\n').map((l) => '  | ' + l).join('\n'));
      console.log('  --- END ---\n');
      sent++;
      continue;
    }

    try {
      await transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: row.email,
        subject,
        text: body,
      });
      row.sent_at = new Date().toISOString();
      row.status = 'sent';
      sent++;
      console.log('  -> sent\n');
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
