import type { EnrichedCompany } from './types.ts';

/** leads_schema.md に準拠した列順 */
export const CSV_COLUMNS = [
  'company_name',
  'website_url',
  'contact_email',
  'contact_form_url',
  'phone',
  'address',
  'prefecture',
  'industry',
  'segment',
  'score',
  'score_reasons',
  'contact_channel',
  'email_source',
  'source_url',
  'robots_allowed',
  'sales_refused',
  'collected_at',
] as const;

function esc(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s: string;
  if (Array.isArray(v)) s = v.join(' / ');     // score_reasons
  else if (typeof v === 'boolean') s = v ? 'true' : 'false';
  else s = String(v);
  if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toCsv(rows: EnrichedCompany[]): string {
  const header = CSV_COLUMNS.join(',');
  const lines = rows.map((r) =>
    CSV_COLUMNS.map((col) => esc((r as unknown as Record<string, unknown>)[col])).join(','),
  );
  // Excel互換のため BOM 付き
  return '﻿' + [header, ...lines].join('\n') + '\n';
}
