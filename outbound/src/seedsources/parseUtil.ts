import * as cheerio from 'cheerio';
import type { SeedCompany } from '../types.ts';
import type { TargetSegment } from '../../config/scoring.ts';

/**
 * リストページ共通のテーブル/リスト構造パーサ。
 * 実サイトはマークアップが異なるため、セレクタはアダプタごとに上書きできる。
 * （デモ用 fixture は下記の既定セレクタに合わせた構造で用意している）
 */
export interface RowConfig {
  segment: TargetSegment;
  industry: string;
  prefecture: string;
  rowSel?: string;
  nameSel?: string;
  addrSel?: string;
  hojinSel?: string;
  urlSel?: string;
}

const DEFAULTS = {
  rowSel: 'tr.company',
  nameSel: '.name',
  addrSel: '.address',
  hojinSel: '.corporate-number',
  urlSel: '.name a',
};

export function parseRows(html: string, sourceUrl: string, cfg: RowConfig): SeedCompany[] {
  const sel = { ...DEFAULTS, ...cfg };
  const $ = cheerio.load(html);
  const out: SeedCompany[] = [];

  $(sel.rowSel).each((_, el) => {
    const name = $(el).find(sel.nameSel).first().text().trim();
    if (!name) return;

    const address = $(el).find(sel.addrSel).first().text().trim() || undefined;

    let corporate_number: string | undefined;
    if (sel.hojinSel) {
      const raw = $(el).find(sel.hojinSel).first().text().replace(/[^\d]/g, '');
      if (/^\d{13}$/.test(raw)) corporate_number = raw;
    }

    let website_url: string | undefined;
    if (sel.urlSel) {
      const href = $(el).find(sel.urlSel).first().attr('href');
      if (href) {
        try { website_url = new URL(href, sourceUrl).toString(); } catch { /* ignore */ }
      }
    }

    out.push({
      company_name: name,
      segment: cfg.segment,
      prefecture: cfg.prefecture,
      address,
      industry: cfg.industry,
      corporate_number,
      website_url,
      seed_source_url: sourceUrl,
    });
  });

  return out;
}
