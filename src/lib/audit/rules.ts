import type { QuoteStatus, ContractStatus, FacilitySize, Level } from './types.ts';

/**
 * 診断ロジック（5問で色分けする仕組み）
 * ------------------------------------------------------------------
 * Q4（見積取得状況）と Q5（契約状況）は全サービス共通で1回だけ聞く。
 * サービスごとの色の違いは AuditService.weight（標準化補正）で生む。
 * Q3（施設規模）は大規模ほど見直しインパクトが大きいので軽く加点する。
 *
 *   リスク点 = 共通点(Q4,Q5) + 規模補正(Q3) + サービス補正(weight, 0以下)
 */

/** Q4/Q5 から算出する共通リスク点 */
export function commonPoints(q: QuoteStatus, c: ContractStatus): number {
  const qp = q === 'never' ? 3 : q === 'over4y' ? 2 : q === 'unknown' ? 1 : 0;
  const cp = c === 'auto' ? 2 : c === 'unknown' ? 1 : 0;
  return qp + cp;
}

/** Q3（施設規模）からの加点。規模が大きいほどコスト差の絶対額が大きい */
export function sizePoints(size: FacilitySize): number {
  return size === 'l' ? 1 : size === 'm' ? 0.5 : 0;
}

/** サービス単位のリスク点（0未満は0に丸める） */
export function servicePoints(q: QuoteStatus, c: ContractStatus, weight: number, size: FacilitySize = 'unknown'): number {
  return Math.max(0, commonPoints(q, c) + sizePoints(size) + weight);
}

/** リスク点 → 見直し優先度 */
export function levelOf(points: number): Level {
  if (points >= 4) return 'high';
  if (points >= 2) return 'mid';
  return 'low';
}

/** 優先度の表示メタ */
export const LEVEL_META: Record<Level, { icon: string; label: string; order: number }> = {
  high: { icon: '🔴', label: '見直し推奨', order: 0 },
  mid:  { icon: '🟡', label: '確認推奨',   order: 1 },
  low:  { icon: '🟢', label: '概ね適正',   order: 2 },
};
