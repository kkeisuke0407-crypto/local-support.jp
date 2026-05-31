import type { QuoteStatus, ContractStatus, Level } from './types.ts';

/**
 * 結果カードの「理由」テキスト生成。
 * すべて Q3/Q4 の「ユーザー自身の回答」から導くため、嘘がない。
 * 金額・同規模比較の断定は一切しない（30秒版では優先度のみが主役）。
 */
export function buildReasons(q: QuoteStatus, c: ContractStatus, level: Level): string[] {
  if (level === 'low') {
    // 🟢は「ユーザーが見直し済み」とは限らない（標準化度で低くなる場合もある）ため、
    // 原因を断定せず中立に表現する。
    if (q === 'within3y' && c === 'reviewed') {
      return ['定期的な比較・見直しができており、概ね適正な状態です'];
    }
    return ['現時点では見直しの優先度は高くありません'];
  }

  const reasons: string[] = [];

  // Q3：見積取得状況
  if (q === 'never') reasons.push('一度も比較したことがない');
  else if (q === 'over4y') reasons.push('長期間、相見積もりを実施していない');
  else if (q === 'unknown') reasons.push('相見積もりの取得状況が不明');

  // Q4：契約状況
  if (c === 'auto') reasons.push('自動更新の可能性');
  else if (c === 'unknown') reasons.push('契約の見直し状況が不明');

  // 中（確認推奨）で具体的な理由が立たない場合のフォロー
  if (reasons.length === 0) {
    reasons.push('比較・見直しのタイミングが近づいている可能性');
  }

  return reasons;
}
