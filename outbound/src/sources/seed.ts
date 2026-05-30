import type { SeedCompany } from '../types.ts';
import type { TargetSegment } from '../../config/scoring.ts';

const VALID_SEGMENTS: TargetSegment[] = [
  'mansion_kanri', 'fudosan_kanri', 'shogyo_shisetsu', 'kaigo', 'byoin', 'clinic', 'bilmen', 'other',
];

/**
 * seed CSV を読む。最低限 company_name と segment があればよい。
 * 想定ヘッダ:
 *   company_name,segment,prefecture,address,website_url,
 *   contact_email,contact_form_url,phone,industry,corporate_number,
 *   employee_count,managed_property_count,facility_count
 *
 * seedの出どころ（MVP）:
 *   - マンション/賃貸管理: 管理業協会の登録業者一覧（公開）
 *   - 介護: 介護サービス情報公表システム
 *   - 病院: 医療機能情報提供制度 / 病院名簿
 *   - 商業施設: 運営会社の公開リスト
 *   いずれも「社名＋所在地（＋URL）」を抽出して本フォーマットに整形する。
 */
export function parseSeedCsv(text: string): SeedCompany[] {
  const rows = parseCsv(text.replace(/^﻿/, ''));
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);

  const out: SeedCompany[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 1 && row[0] === '') continue;
    const get = (name: string) => {
      const j = idx(name);
      return j >= 0 ? (row[j] ?? '').trim() : '';
    };
    const name = get('company_name');
    if (!name) continue;

    const segRaw = get('segment') as TargetSegment;
    const segment: TargetSegment = VALID_SEGMENTS.includes(segRaw) ? segRaw : 'other';

    const num = (s: string): number | null => {
      const n = parseInt(s.replace(/[^\d]/g, ''), 10);
      return Number.isFinite(n) ? n : null;
    };

    out.push({
      company_name: name,
      segment,
      prefecture: get('prefecture') || undefined,
      address: get('address') || undefined,
      website_url: get('website_url') || undefined,
      contact_email: get('contact_email') || undefined,
      contact_form_url: get('contact_form_url') || undefined,
      phone: get('phone') || undefined,
      industry: get('industry') || undefined,
      corporate_number: get('corporate_number') || undefined,
      employee_count: num(get('employee_count')),
      managed_property_count: num(get('managed_property_count')),
      facility_count: num(get('facility_count')),
      sales_refused: /^(true|1|yes)$/i.test(get('sales_refused')),
    });
  }
  return out;
}

/** RFC4180 ざっくり対応の CSV パーサ（ダブルクオート/改行/カンマ対応） */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}
