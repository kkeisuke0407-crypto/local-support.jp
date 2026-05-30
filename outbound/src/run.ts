/**
 * 収集＋エンリッチャー CLI
 * ------------------------------------------------------------------
 * 使い方:
 *   npm run collect -- --seed data/seed.tokyo.csv --limit 100 --out out/leads.csv
 *   npm run demo            # サンプルseedをオフライン処理して出力フォーマット実証
 *
 * フロー: seed読込 → エンリッチ(メール最優先) → スコアリング → 優先順ソート → CSV出力
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseSeedCsv } from './sources/seed.ts';
import { enrichCompany } from './enrich.ts';
import { scoreCompany } from './score.ts';
import { toCsv } from './csv.ts';
import { prioritize } from './prioritize.ts';
import type { EnrichedCompany } from './types.ts';

interface Args {
  seed: string;
  out: string;
  limit: number;
  fetch: boolean;
  delayMs: number;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { seed: 'data/seed.tokyo.csv', out: 'out/leads.csv', limit: 100, fetch: true, delayMs: 1500 };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--seed') a.seed = argv[++i];
    else if (k === '--out') a.out = argv[++i];
    else if (k === '--limit') a.limit = parseInt(argv[++i], 10);
    else if (k === '--no-fetch') a.fetch = false;
    else if (k === '--delay') a.delayMs = parseInt(argv[++i], 10);
  }
  return a;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.error(`[collect] seed=${args.seed} limit=${args.limit} fetch=${args.fetch} delay=${args.delayMs}ms`);

  const seeds = parseSeedCsv(readFileSync(args.seed, 'utf8')).slice(0, args.limit);
  console.error(`[collect] ${seeds.length}社を処理します`);

  const results: EnrichedCompany[] = [];
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const enriched = await enrichCompany(seed, { fetch: args.fetch, perRequestDelayMs: args.delayMs });
    results.push(scoreCompany(enriched));
    const r = results[results.length - 1];
    console.error(
      `  [${i + 1}/${seeds.length}] ${seed.company_name} → score=${r.score} ch=${r.contact_channel}` +
        (r.contact_email ? ` mail=${r.contact_email}` : '') +
        (r.sales_refused ? ' ⚠営業お断り' : ''),
    );
  }

  const sorted = prioritize(results);
  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, toCsv(sorted), 'utf8');

  // サマリ
  const byCh = sorted.reduce<Record<string, number>>((m, r) => {
    const c = r.contact_channel ?? 'manual';
    m[c] = (m[c] ?? 0) + 1;
    return m;
  }, {});
  console.error(`\n[done] ${sorted.length}社 → ${args.out}`);
  console.error(`  チャネル内訳: email=${byCh.email ?? 0} / form=${byCh.form ?? 0} / manual=${byCh.manual ?? 0}`);
  console.error(`  メール取得率: ${Math.round(((byCh.email ?? 0) / sorted.length) * 100)}%`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
