import type { EnrichedCompany } from './types.ts';
import { SEGMENT_PRIORITY } from '../config/scoring.ts';

/** 営業効果順：メール経路を最優先 → スコア降順 → セグメント優先順 */
export function prioritize(rows: EnrichedCompany[]): EnrichedCompany[] {
  const segRank = new Map(SEGMENT_PRIORITY.map((s, i) => [s, i]));
  const chRank: Record<string, number> = { email: 0, form: 1, manual: 2 };
  return [...rows].sort((x, y) => {
    const ch = (chRank[x.contact_channel ?? 'manual'] ?? 9) - (chRank[y.contact_channel ?? 'manual'] ?? 9);
    if (ch !== 0) return ch;
    if ((y.score ?? 0) !== (x.score ?? 0)) return (y.score ?? 0) - (x.score ?? 0);
    return (segRank.get(x.segment) ?? 99) - (segRank.get(y.segment) ?? 99);
  });
}
