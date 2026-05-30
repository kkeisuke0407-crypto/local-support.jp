import type { SeedCompany } from '../types.ts';
import type { TargetSegment } from '../../config/scoring.ts';
import type { FetchFn, PrefRef, SeedSource } from './types.ts';
import { mansionKanri } from './mansionKanri.ts';
import { fudosanKanri } from './fudosanKanri.ts';
import { kaigo } from './kaigo.ts';
import { shogyo } from './shogyo.ts';
import { byoin } from './byoin.ts';

/** 取得元レジストリ（営業効果の優先順位どおりに並べる） */
export const SOURCES: SeedSource[] = [
  mansionKanri, // 1
  fudosanKanri, // 1
  kaigo,        // 2
  shogyo,       // 3
  byoin,        // 4
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 社名の正規化（重複排除キー用） */
export function normalizeName(name: string): string {
  return name
    .replace(/株式会社|（株）|\(株\)|有限会社|合同会社|一般社団法人|公益社団法人|医療法人(社団|財団)?|社会福祉法人|学校法人/g, '')
    .replace(/[\s　]/g, '')
    .toLowerCase();
}

/** 重複排除：法人番号があれば最優先、無ければ 正規化社名＋都道府県。先勝ち（優先順位の高い取得元を残す）。 */
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
  fetch: FetchFn;
  segments?: TargetSegment[];   // 取得対象セグメント（未指定なら全部）
  limit?: number;               // 全体の上限
  perSegmentLimit?: number;     // セグメントごとの上限
  perRequestDelayMs?: number;   // 礼儀的アクセス間隔（live時）
}

/**
 * セグメント別アダプタを優先順位順に回し、母集団 SeedCompany[] を生成。
 * 各レコードに seed_source_url を保存。最後に重複排除＋上限適用。
 */
export async function runSeedSources(opt: SeedRunOptions): Promise<SeedCompany[]> {
  const delay = opt.perRequestDelayMs ?? 1500;
  const collected: SeedCompany[] = [];
  const perSegCount = new Map<TargetSegment, number>();

  for (const src of SOURCES) {
    if (opt.segments && !opt.segments.includes(src.segment)) continue;

    const urls = opt.mode === 'fixture' ? [src.demo.url] : src.liveListUrls(opt.pref);
    const fixtureMapHint = opt.mode === 'fixture' ? `（fixture: ${src.demo.fixture}）` : '';
    console.error(`[seed] ${src.segment} ← ${src.name} ${fixtureMapHint}`);

    for (const url of urls) {
      const html = await opt.fetch(url);
      if (opt.mode === 'live') await sleep(delay);
      if (!html) {
        console.error(`  取得失敗/スキップ: ${url}`);
        continue;
      }
      const rows = src.parseList(html, opt.mode === 'fixture' ? src.homepage : url);
      // セグメント上限
      for (const r of rows) {
        const n = perSegCount.get(src.segment) ?? 0;
        if (opt.perSegmentLimit && n >= opt.perSegmentLimit) break;
        collected.push(r);
        perSegCount.set(src.segment, n + 1);
      }
      console.error(`  +${rows.length}社 (${url})`);
    }
  }

  const deduped = dedup(collected);
  const limited = opt.limit ? deduped.slice(0, opt.limit) : deduped;
  console.error(`[seed] 収集 ${collected.length} → 重複排除後 ${deduped.length} → 出力 ${limited.length}`);
  return limited;
}

/** デモ用：SOURCES の demo.url → fixtureファイル のマップを作る */
export function buildFixtureMap(base = ''): Map<string, string> {
  const m = new Map<string, string>();
  for (const s of SOURCES) m.set(s.demo.url, base ? `${base}/${s.demo.fixture}` : s.demo.fixture);
  return m;
}
