/**
 * 一気通貫パイプライン CLI
 * ------------------------------------------------------------------
 * seed自動取得 → エンリッチ（メール最優先） → スコアリング → CSV出力
 *
 *   本番:  npm run pipeline -- --pref 東京都 --limit 100 --out out/leads.tokyo.csv
 *   デモ:  npm run pipeline:demo   （fixtureから生成・--no-fetch）
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { runSeedSources, buildFixtureMap } from './seedsources/index.ts';
import { httpFetch, fixtureFetch } from './seedsources/fetcher.ts';
import { prefByName } from './seedsources/prefs.ts';
import { enrichCompany } from './enrich.ts';
import { scoreCompany } from './score.ts';
import { prioritize } from './prioritize.ts';
import { toCsv } from './csv.ts';
import { toSeedCsv } from './seedCsv.ts';
import { computeMetrics, formatMetrics } from './metrics.ts';
import type { EnrichedCompany } from './types.ts';

interface Args {
  pref: string;
  out: string;
  seedOut?: string;
  limit?: number;
  perSegmentLimit?: number;
  mode: 'live' | 'fixture';
  fetchSites: boolean;
  delayMs: number;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { pref: '東京都', out: 'out/leads.tokyo.csv', mode: 'live', fetchSites: true, delayMs: 1500 };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--pref') a.pref = argv[++i];
    else if (k === '--out') a.out = argv[++i];
    else if (k === '--seed-out') a.seedOut = argv[++i];
    else if (k === '--limit') a.limit = parseInt(argv[++i], 10);
    else if (k === '--per-segment') a.perSegmentLimit = parseInt(argv[++i], 10);
    else if (k === '--mode') a.mode = argv[++i] as 'live' | 'fixture';
    else if (k === '--no-fetch') a.fetchSites = false;
    else if (k === '--delay') a.delayMs = parseInt(argv[++i], 10);
  }
  return a;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  console.error(`[pipeline] pref=${a.pref} mode=${a.mode} fetchSites=${a.fetchSites} limit=${a.limit ?? '∞'}`);

  // 1) seed自動取得
  const pref = prefByName(a.pref);
  const seedFetch = a.mode === 'fixture' ? fixtureFetch(buildFixtureMap()) : httpFetch();
  const { companies: seeds, stats } = await runSeedSources({
    pref, mode: a.mode, fetch: seedFetch,
    limit: a.limit, perSegmentLimit: a.perSegmentLimit, perRequestDelayMs: a.delayMs,
  });
  if (a.seedOut) {
    mkdirSync(dirname(a.seedOut), { recursive: true });
    writeFileSync(a.seedOut, toSeedCsv(seeds), 'utf8');
    console.error(`[pipeline] seed保存 → ${a.seedOut}`);
  }

  // 2) エンリッチ（メール最優先） + 3) スコアリング
  const results: EnrichedCompany[] = [];
  for (let i = 0; i < seeds.length; i++) {
    const enriched = await enrichCompany(seeds[i], { fetch: a.fetchSites, perRequestDelayMs: a.delayMs });
    results.push(scoreCompany(enriched));
  }

  // 4) 営業効果順ソート → CSV出力
  const sorted = prioritize(results);
  mkdirSync(dirname(a.out), { recursive: true });
  writeFileSync(a.out, toCsv(sorted), 'utf8');

  // 指標を算出し、CSVの隣に stats.json として保存（report で再表示できる）
  const metrics = computeMetrics(sorted);
  const statsPath = a.out.replace(/\.csv$/, '.stats.json');
  writeFileSync(statsPath, JSON.stringify({ ...stats, metrics }, null, 2), 'utf8');

  console.error(`\n[done] ${sorted.length}社 → ${a.out}`);
  console.error(formatMetrics(metrics, stats));
  console.error(`（指標は ${statsPath} にも保存。再表示は: npm run report -- --in ${a.out}）`);
  if (a.mode === 'fixture' || !a.fetchSites) {
    console.error('※ デモ/オフライン：メール抽出は実サイト巡回が必要なため、ほとんど manual になります（本番 --mode live で email が増えます）');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
