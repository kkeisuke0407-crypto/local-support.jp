import type { SeedCompany } from '../types.ts';
import type { TargetSegment } from '../../config/scoring.ts';
import type { LoadContext, PrefRef, SeedSource } from './types.ts';
import { textFetch } from './fetcher.ts';
import { kaigo } from './kaigo.ts';
import { byoin } from './byoin.ts';
import { mansionKanri } from './mansionKanri.ts';
import { fudosanKanri } from './fudosanKanri.ts';
import { shogyo } from './shogyo.ts';

/**
 * 取得元レジストリ（新方針の優先順位：安定取得元＝CSV/公的データを上位に）
 *  1. 介護（CSV）   2. 医療（CSV）   3. マンション管理（HTML・後回し）
 *  4. 不動産（HTML・後回し）   5. 商業施設（HTML・後回し）
 */
export const SOURCES: SeedSource[] = [
  kaigo,        // 1 CSV（安定）
  byoin,        // 2 CSV（安定）
  mansionKanri, // 3 HTML（要調整）
  fudosanKanri, // 4 HTML（要調整）
  shogyo,       // 5 HTML（要調整）
];

/** 社名の正規化（重複排除キー用） */
export function normalizeName(name: string): string {
  return name
    .replace(/株式会社|（株）|\(株\)|有限会社|合同会社|一般社団法人|公益社団法人|医療法人(社団|財団)?|社会福祉法人|学校法人/g, '')
    .replace(/[\s　]/g, '')
    .toLowerCase();
}

/** 重複排除：法人番号があれば最優先、無ければ 正規化社名＋都道府県。先勝ち。 */
export function dedup(list: SeedCompany[]): SeedCompany[] {
  const seen = new Set<string>();
  const out: SeedCompany[] = [];
  for (const c of list) {
    const key = c.corporate_number
      ? `H:${c.corporate_number}`
      : `N:${normalizeName(c.company_name)}|${c.prefecture ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

export interface SeedRunOptions {
  pref: PrefRef;
  mode: 'live' | 'fixture';
  segments?: TargetSegment[];
  onlyStable?: boolean;       // 安定取得元（CSV/API）だけに絞る
  limit?: number;
  perSegmentLimit?: number;
  dataDir?: string;           // csv-file の置き場（既定 data/sources）
  fixtureDir?: string;        // 既定 fixtures
}

export interface SeedRunResult {
  companies: SeedCompany[];
  stats: { collected: number; deduped: number };
}

export async function runSeedSources(opt: SeedRunOptions): Promise<SeedRunResult> {
  const ctx: LoadContext = {
    pref: opt.pref,
    mode: opt.mode,
    fetch: textFetch(),
    dataDir: opt.dataDir ?? 'data/sources',
    fixtureDir: opt.fixtureDir ?? 'fixtures',
  };

  const collected: SeedCompany[] = [];
  const perSegCount = new Map<TargetSegment, number>();

  for (const src of SOURCES) {
    if (opt.segments && !opt.segments.includes(src.segment)) continue;
    if (opt.onlyStable && !src.stable) continue;

    console.error(`[seed] ${src.segment} ← ${src.name} [${src.kind}${src.stable ? '/安定' : ''}]`);
    let rows: SeedCompany[] = [];
    try {
      rows = await src.load(ctx);
    } catch (e) {
      console.error(`  読み込みエラー: ${(e as Error).message}`);
    }

    let added = 0;
    for (const r of rows) {
      const n = perSegCount.get(src.segment) ?? 0;
      if (opt.perSegmentLimit && n >= opt.perSegmentLimit) break;
      collected.push(r);
      perSegCount.set(src.segment, n + 1);
      added++;
    }
    console.error(`  +${added}社`);
  }

  const deduped = dedup(collected);
  const limited = opt.limit ? deduped.slice(0, opt.limit) : deduped;
  console.error(`[seed] 収集 ${collected.length} → 重複排除後 ${deduped.length} → 出力 ${limited.length}`);
  return { companies: limited, stats: { collected: collected.length, deduped: deduped.length } };
}
