/**
 * リスト品質レポート CLI
 * ------------------------------------------------------------------
 *   npm run report -- --in out/leads.tokyo.csv
 *
 * 生成済みCSVから指標を算出して表示する。
 * 同じ場所に <in>.stats.json があれば収集総数・重複除外件数も表示。
 */
import { readFileSync, existsSync } from 'node:fs';
import { parseCsvToObjects } from './csvParse.ts';
import { computeMetrics, formatMetrics, type MetricRow, type RunStats } from './metrics.ts';

function parseArgs(argv: string[]): { in: string } {
  let inPath = 'out/leads.tokyo.csv';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--in') inPath = argv[++i];
  }
  return { in: inPath };
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!existsSync(a.in)) {
    console.error(`CSVが見つかりません: ${a.in}`);
    process.exit(1);
  }
  const rows = parseCsvToObjects(readFileSync(a.in, 'utf8')).map<MetricRow>((r) => ({
    segment: r.segment || undefined,
    score: r.score ? parseInt(r.score, 10) : 0,
    contact_channel: r.contact_channel || undefined,
    contact_email: r.contact_email || undefined,
    contact_form_url: r.contact_form_url || undefined,
    sales_refused: /^(true|1|yes)$/i.test(r.sales_refused || ''),
  }));

  let stats: RunStats | undefined;
  const statsPath = a.in.replace(/\.csv$/, '.stats.json');
  if (existsSync(statsPath)) {
    try { stats = JSON.parse(readFileSync(statsPath, 'utf8')); } catch { /* ignore */ }
  }

  console.log(`対象: ${a.in}`);
  console.log(formatMetrics(computeMetrics(rows), stats));
}

main();
