import type { EnrichedCompany } from './types.ts';
import { computeScore, type CompanyInput } from '../config/scoring.ts';

/**
 * エンリッチ結果を scoring.ts の入力に変換してスコアリング。
 * チャネル判定：email > form > manual（=hold相当。CSVでは 'manual' 表記）。
 */
export function scoreCompany(c: EnrichedCompany): EnrichedCompany {
  const input: CompanyInput = {
    segment: c.segment,
    hasContactEmail: !!c.contact_email,
    emailIsPersonal: c.email_is_personal,
    hasContactForm: !!c.contact_form_url,
    prefecture: c.prefecture,
    managedPropertyCount: c.managed_property_count ?? null,
    facilityCount: c.facility_count ?? null,
    employeeCount: c.employee_count ?? null,
    salesRefused: c.sales_refused,
  };

  const { score, reasons, channel } = computeScore(input);

  // scoring.ts の 'hold' は、運用上の指示に合わせて CSV では 'manual' と表記
  const csvChannel = channel === 'hold' ? 'manual' : channel;

  return { ...c, score, score_reasons: reasons, contact_channel: csvChannel };
}
