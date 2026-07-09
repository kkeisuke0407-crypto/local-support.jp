import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { SeedCompany } from '../types.ts';
import type { TargetSegment } from '../../config/scoring.ts';
import type { LoadContext, SeedSource, PrefRef } from './types.ts';
import { parseCsvToObjects } from '../csvParse.ts';

/**
 * CSV/オープンデータ系の取得元（最も安定）。
 *  - live: 直URL（csv-url）から取得 or 手元にDL済みCSV（csv-file）を読む
 *  - fixture: 同梱のサンプルCSVを読む
 * カラム名は取得元ごとに揺れるため、候補名の「部分一致」で柔軟にマッピングする。
 */
export interface CsvColumnMap {
  /** 会社名（運営法人を優先：先頭の候補から順に部分一致でヒットを採用） */
  company_name: string[];
  corporate_number?: string[]; // 法人番号
  /** 住所：これらを含むヘッダ列を出現順に連結（都道府県＋市区町村＋番地 等） */
  addressContains?: string[];
  website_url?: string[];
}

export interface CsvSourceConfig {
  segment: TargetSegment;
  name: string;
  homepage: string;
  industry: string;
  column: CsvColumnMap;
  /** live(csv-url)：都道府県ごとの直CSV URL */
  liveUrl?: (pref: PrefRef) => string;
  /** live(csv-file)：dataDir からの相対パス（手元にDLしたCSV） */
  liveFile?: (pref: PrefRef) => string;
  /** demo：fixtureDir からの相対パス */
  demoFile: string;
  /** 全国CSVの場合：この列名で都道府県を絞り込む（値が pref.name と一致する行のみ採用） */
  prefectureColumn?: string;
  /** 全国CSVの場合：この列名（都道府県コード）が pref.code と一致する行のみ採用 */
  prefectureCodeColumn?: string;
}

function findHeader(headers: string[], candidates: string[]): string | undefined {
  for (const cand of candidates) {
    const hit = headers.find((h) => h === cand) ?? headers.find((h) => h.includes(cand));
    if (hit) return hit;
  }
  return undefined;
}

function joinAddress(row: Record<string, string>, headers: string[], contains: string[]): string | undefined {
  const cols = headers.filter((h) => contains.some((c) => h.includes(c)));
  const parts = cols.map((h) => row[h]).filter((v) => v && v.trim());
  const joined = parts.join('');
  return joined || undefined;
}

export function csvSource(cfg: CsvSourceConfig): SeedSource {
  return {
    segment: cfg.segment,
    name: cfg.name,
    homepage: cfg.homepage,
    kind: cfg.liveUrl ? 'csv-url' : 'csv-file',
    stable: true,
    async load(ctx: LoadContext): Promise<SeedCompany[]> {
      let text: string | null = null;
      let sourceUrl = cfg.homepage;

      if (ctx.mode === 'fixture') {
        const p = join(ctx.fixtureDir, cfg.demoFile);
        text = existsSync(p) ? readFileSync(p, 'utf8') : null;
        if (!text) console.error(`  fixture無し: ${p}`);
      } else if (cfg.liveUrl) {
        sourceUrl = cfg.liveUrl(ctx.pref);
        text = await ctx.fetch(sourceUrl);
      } else if (cfg.liveFile) {
        const p = join(ctx.dataDir, cfg.liveFile(ctx.pref));
        if (existsSync(p)) {
          text = readFileSync(p, 'utf8');
          sourceUrl = cfg.homepage;
        } else {
          console.error(`  CSV未配置（手動DLが必要）: ${p}`);
        }
      }
      if (!text) return [];
      // UTF-8 BOM を除去（医療機能情報のCSVなど BOM 付きで配布されるため）
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

      const rows = parseCsvToObjects(text);
      if (rows.length === 0) return [];
      const headers = Object.keys(rows[0]);

      const nameH = findHeader(headers, cfg.column.company_name);
      const hojinH = cfg.column.corporate_number ? findHeader(headers, cfg.column.corporate_number) : undefined;
      const urlH = cfg.column.website_url ? findHeader(headers, cfg.column.website_url) : undefined;
      const addrContains = cfg.column.addressContains ?? ['所在地', '住所'];
      const prefH = cfg.prefectureColumn ? findHeader(headers, [cfg.prefectureColumn]) : undefined;
      const prefCodeH = cfg.prefectureCodeColumn ? findHeader(headers, [cfg.prefectureCodeColumn]) : undefined;

      if (!nameH) {
        console.error(`  会社名カラムが見つかりません（ヘッダ: ${headers.join(' / ')}）`);
        return [];
      }

      const out: SeedCompany[] = [];
      for (const row of rows) {
        if (prefH && (row[prefH] ?? '').trim() !== ctx.pref.name) continue;
        if (prefCodeH) {
          const v = (row[prefCodeH] ?? '').trim().replace(/^0+/, '');
          if (v !== ctx.pref.code.replace(/^0+/, '')) continue;
        }
        const name = (row[nameH] ?? '').trim();
        if (!name) continue;
        const cnRaw = hojinH ? (row[hojinH] ?? '').replace(/[^\d]/g, '') : '';
        out.push({
          company_name: name,
          segment: cfg.segment,
          prefecture: ctx.pref.name,
          address: joinAddress(row, headers, addrContains),
          industry: cfg.industry,
          corporate_number: /^\d{13}$/.test(cnRaw) ? cnRaw : undefined,
          website_url: urlH ? (row[urlH] || undefined) : undefined,
          seed_source_url: sourceUrl,
        });
      }
      return out;
    },
  };
}
