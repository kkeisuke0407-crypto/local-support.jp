import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { SeedCompany } from '../types.ts';
import type { TargetSegment } from '../../config/scoring.ts';
import type { LoadContext, SeedSource, PrefRef } from './types.ts';
import { parseRows, type RowConfig } from './parseUtil.ts';

/**
 * HTMLスクレイピング系の取得元（壊れやすいので後回し対象）。
 * 実サイトのマークアップに合わせて selectors を稼働時に調整する。
 */
export interface HtmlSourceConfig {
  segment: TargetSegment;
  name: string;
  homepage: string;
  industry: string;
  liveListUrls: (pref: PrefRef) => string[];
  demoFile: string;                 // fixtureDir からの相対パス
  selectors?: Partial<RowConfig>;   // rowSel/nameSel など上書き
}

export function htmlSource(cfg: HtmlSourceConfig): SeedSource {
  return {
    segment: cfg.segment,
    name: cfg.name,
    homepage: cfg.homepage,
    kind: 'html',
    stable: false,
    async load(ctx: LoadContext): Promise<SeedCompany[]> {
      const rowCfg: RowConfig = {
        segment: cfg.segment,
        industry: cfg.industry,
        prefecture: ctx.pref.name,
        ...cfg.selectors,
      };

      if (ctx.mode === 'fixture') {
        const p = join(ctx.fixtureDir, cfg.demoFile);
        if (!existsSync(p)) { console.error(`  fixture無し: ${p}`); return []; }
        return parseRows(readFileSync(p, 'utf8'), cfg.homepage, rowCfg);
      }

      const out: SeedCompany[] = [];
      for (const url of cfg.liveListUrls(ctx.pref)) {
        const html = await ctx.fetch(url);
        if (!html) { console.error(`  取得失敗/スキップ: ${url}`); continue; }
        out.push(...parseRows(html, url, rowCfg));
      }
      return out;
    },
  };
}
