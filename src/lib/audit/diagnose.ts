import type { DiagnosisInput, DiagnosisResult, ServiceResult } from './types.ts';
import { SERVICE_BY_ID } from './services.ts';
import { servicePoints, levelOf, LEVEL_META } from './rules.ts';
import { buildReasons } from './reasons.ts';

/**
 * 4問の入力から診断結果を組み立てる。
 *  - 各サービスのリスク点 → 優先度（高/中/低）
 *  - 優先度の高い順に並べ替え
 *  - 施設管理リスクスコア（100 = 健全）を算出
 */
export function diagnose(input: DiagnosisInput): DiagnosisResult {
  const { serviceIds, facilitySize, quoteStatus, contractStatus } = input;

  const results: ServiceResult[] = serviceIds
    .map((id) => SERVICE_BY_ID[id])
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => {
      const points = servicePoints(quoteStatus, contractStatus, s.weight, facilitySize);
      const level = levelOf(points);
      return { id: s.id, label: s.label, level, points, reasons: buildReasons(quoteStatus, contractStatus, level, facilitySize) };
    });

  // 優先度（高→中→低）→ 同優先度内はリスク点の高い順
  results.sort((a, b) => LEVEL_META[a.level].order - LEVEL_META[b.level].order || b.points - a.points);

  const counts = {
    high: results.filter((r) => r.level === 'high').length,
    mid: results.filter((r) => r.level === 'mid').length,
    low: results.filter((r) => r.level === 'low').length,
  };

  // リスクスコア：高=12 / 中=6 / 自動更新等の弱シグナルは点数に内包済み。100から減算。
  const penalty = counts.high * 12 + counts.mid * 6;
  const score = Math.max(40, 100 - penalty);

  return { results, counts, score };
}
