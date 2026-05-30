/**
 * seed自動取得 CLI（母集団の自動生成のみ）
 * ------------------------------------------------------------------
 *   npm run seed -- --pref 東京都 --limit 100 --out data/seed.tokyo.csv
 *   npm run seed:demo            # fixtureから生成（ネットワーク不要）
 *
 * セグメント別アダプタを優先順位順に回し、重複排除して seed CSV を出力する。
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { runSeedSources, buildFixtureMap } from './seedsources/index.ts';
import { httpFetch, fixtureFetch } from './seedsources/fetcher.ts';
import { prefByName } from './seedsources/prefs.ts';
import { toSeedCsv } from './seedCsv.ts';
import type { TargetSegment } from '../config/scoring.ts';

interface Args {
  pref: string;
  out: string;
  limit?: number;
  perSegmentLimit?: number;
  mode: 'live' | 'fixture';
  segments?: TargetSegment[];
  delayMs: number;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { pref: '東京都', out: 'data/seed.tokyo.csv', mode: 'live', delayMs: 1500 };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--pref') a.pref = argv[++i];
    else if (k === '--out') a.out = argv[++i];
    else if (k === '--limit') a.limit = parseInt(argv[++i], 10);
    else if (k === '--per-segment') a.perSegmentLimit = parseInt(argv[++i], 10);
    else if (k === '--mode') a.mode = argv[++i] as 'live' | 'fixture';
    else if (k === '--segments') a.segments = argv[++i].split(',') as TargetSegment[];
    else if (k === '--delay') a.delayMs = parseInt(argv[++i], 10);
  }
  return a;
}

export async function buildSeed(a: Args) {
  const pref = prefByName(a.pref);
  const fetch = a.mode === 'fixture' ? fixtureFetch(buildFixtureMap()) : httpFetch();
  const rows = await runSeedSources({
    pref,
    mode: a.mode,
    fetch,
    segments: a.segments,
    limit: a.limit,
    perSegmentLimit: a.perSegmentLimit,
    perRequestDelayMs: a.delayMs,
  });
  return rows;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  console.error(`[seed-build] pref=${a.pref} mode=${a.mode} limit=${a.limit ?? '∞'}`);
  const rows = await buildSeed(a);
  mkdirSync(dirname(a.out), { recursive: true });
  writeFileSync(a.out, toSeedCsv(rows), 'utf8');
  console.error(`[seed-build] ${rows.length}社 → ${a.out}`);
}

// CLIとして直接実行された時のみ main を走らせる
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
