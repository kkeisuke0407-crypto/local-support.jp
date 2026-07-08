import type { EnrichedCompany } from './types.ts';

/**
 * 人間レビュー用CSV：上位N件に絞り、判定欄を最初に置く。
 *  - judgement / reviewer_note は空欄で出力（レビュー時に手入力）
 *  - 連絡先・スコア理由を先頭に並べて目視しやすくする
 */
export const REVIEW_COLUMNS = [
  'judgement',          // OK / NG / 保留 を手で記入
  'reviewer_note',      // 自由記入
  'rank',
  'company_name',
  'score',
  'contact_channel',
  'contact_email',
  'contact_form_url',
  'website_url',
  'address',
  'prefecture',
  'segment',
  'industry',
  'phone',
  'score_reasons',
  'email_source',
  'sales_refused',
] as const;

function esc(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s: string;
  if (Array.isArray(v)) s = v.join(' / ');
  else if (typeof v === 'boolean') s = v ? 'true' : 'false';
  else s = String(v);
  if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toReviewCsv(rows: EnrichedCompany[], topN = 50): string {
  const top = rows.slice(0, topN).map((r, i) => ({ ...r, rank: i + 1, judgement: '', reviewer_note: '' }));
  const header = REVIEW_COLUMNS.join(',');
  const lines = top.map((r) =>
    REVIEW_COLUMNS.map((col) => esc((r as unknown as Record<string, unknown>)[col])).join(','),
  );
  return '﻿' + [header, ...lines].join('\n') + '\n';
}
