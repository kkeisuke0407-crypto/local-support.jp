import type { TargetSegment, ContactChannel } from '../config/scoring.ts';

/** seed（入力）の1社。協会名簿・公的DB等から用意する最小情報。 */
export interface SeedCompany {
  company_name: string;
  segment: TargetSegment;
  prefecture?: string;
  address?: string;
  website_url?: string;
  // --no-fetch（オフライン実証）用：既に埋まっている場合はエンリッチをスキップ
  contact_email?: string;
  contact_form_url?: string;
  phone?: string;
  industry?: string;
  corporate_number?: string;
  employee_count?: number | null;
  managed_property_count?: number | null;
  facility_count?: number | null;
  sales_refused?: boolean;
  seed_source_url?: string;  // 母集団をどこから取得したか（取得元URL）
}

/** エンリッチ後の1社（CSV出力の元）。 */
export interface EnrichedCompany extends SeedCompany {
  email_source?: 'website' | 'directory' | 'manual' | '';
  email_is_personal?: boolean;
  robots_allowed?: boolean;
  sales_refused?: boolean;
  source_url?: string;      // 取得元URL
  collected_at: string;     // ISO8601
  // スコアリング結果
  score?: number;
  score_reasons?: string[];
  contact_channel?: ContactChannel | 'manual';
}
