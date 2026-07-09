import type { SeedCompany } from './types.ts';

/** sources/seed.ts のパーサが読める seed CSV を書き出す */
export const SEED_COLUMNS = [
  'company_name',
  'segment',
  'prefecture',
  'address',
  'website_url',
  'contact_email',
  'contact_form_url',
  'phone',
  'industry',
  'corporate_number',
  'employee_count',
  'managed_property_count',
  'facility_count',
  'sales_refused',
  'seed_source_url',
] as const;

function esc(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v);
  if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toSeedCsv(rows: SeedCompany[]): string {
  const header = SEED_COLUMNS.join(',');
  const lines = rows.map((r) =>
    SEED_COLUMNS.map((c) => esc((r as unknown as Record<string, unknown>)[c])).join(','),
  );
  return '﻿' + [header, ...lines].join('\n') + '\n';
}
