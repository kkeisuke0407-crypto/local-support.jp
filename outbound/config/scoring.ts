/**
 * 営業リード スコアリング仕様（単一のソース・オブ・トゥルース）
 * ------------------------------------------------------------------
 * 100点満点。computeScore() がスコア・理由・推奨アプローチ経路を返す。
 * 最適化目標は「獲得案件数（送客数）の最大化」。収益モデルは考慮しない。
 *
 * 配点の軸（合計 最大100）:
 *   A. ターゲット適合 segment        … 0–30
 *   B. 到達手段 reachability         … 0–30  （★メール最優先）
 *   C. 規模・多物件 scale            … 0–25  （物件/施設 0–15 ＋ 従業員 0–10）
 *   D. 地域 region                   … 0–10
 *   E. サービス親和性 serviceFit     … 0–5
 */

export type TargetSegment =
  | 'mansion_kanri'   // マンション管理会社
  | 'fudosan_kanri'   // 不動産・ビル管理会社
  | 'shogyo_shisetsu' // 商業施設運営会社
  | 'kaigo'           // 介護施設運営会社
  | 'byoin'           // 病院法人
  | 'clinic'          // クリニック
  | 'bilmen'          // ビルメンテナンス会社（※自社施工懸念・低優先/提携候補）
  | 'other';

export type ContactChannel = 'email' | 'form' | 'hold';

export interface CompanyInput {
  segment: TargetSegment;
  hasContactEmail: boolean;            // 問い合わせ/担当メールあり
  emailIsPersonal?: boolean;           // 個別担当アドレス(部署/個人) か（info@等より高評価）
  hasContactForm: boolean;             // 問い合わせフォームURLを検出
  prefecture?: string;                 // 例 '東京都'
  managedPropertyCount?: number | null; // 管理物件数（取得できた場合）
  facilityCount?: number | null;        // 運営施設数（介護/商業など）
  employeeCount?: number | null;        // 従業員数
  salesRefused?: boolean;              // 「営業お断り」明記
}

export interface ScoreResult {
  score: number;            // 0..100
  reasons: string[];        // スコア理由（CSV/CRMに保存）
  channel: ContactChannel;  // 推奨アプローチ経路（email > form > hold）
}

/* ── A. ターゲット適合（最大30） ───────────────────────────── */
const SEGMENT_POINTS: Record<TargetSegment, { pt: number; label: string }> = {
  mansion_kanri:   { pt: 30, label: 'マンション管理会社（多物件・受水槽/消防が法定必須）' },
  fudosan_kanri:   { pt: 30, label: '不動産・ビル管理会社（多物件・法定需要）' },
  shogyo_shisetsu: { pt: 24, label: '商業施設運営（多サービス・単価大）' },
  kaigo:           { pt: 22, label: '介護施設運営（全サービス必須・意思決定が速い）' },
  byoin:           { pt: 18, label: '病院法人（必須需要・意思決定は遅め）' },
  clinic:          { pt: 14, label: 'クリニック（需要小・単発寄り）' },
  bilmen:          { pt: 8,  label: 'ビルメン/施設管理（自社施工懸念・提携候補寄り）' },
  other:           { pt: 5,  label: 'その他業種' },
};

/* ── D. 地域（最大10） ─────────────────────────────────────── */
const KANTO_3 = ['神奈川県', '埼玉県', '千葉県'];
const KANTO_OTHER = ['茨城県', '栃木県', '群馬県'];

function regionScore(pref?: string): { pt: number; label: string } {
  if (!pref) return { pt: 0, label: '所在地不明' };
  if (pref === '東京都') return { pt: 10, label: '東京都（最優先エリア）' };
  if (KANTO_3.includes(pref)) return { pt: 8, label: '関東主要3県' };
  if (KANTO_OTHER.includes(pref)) return { pt: 6, label: '北関東' };
  return { pt: 3, label: 'その他エリア' };
}

/* ── C. 規模（物件/施設 最大15 ＋ 従業員 最大10） ───────────── */
function facilityScore(managed?: number | null, facility?: number | null): { pt: number; label: string } {
  const n = Math.max(managed ?? 0, facility ?? 0);
  if (n >= 300) return { pt: 15, label: `物件/施設 ${n}（大規模・横展開大）` };
  if (n >= 100) return { pt: 12, label: `物件/施設 ${n}（多数）` };
  if (n >= 30)  return { pt: 9,  label: `物件/施設 ${n}` };
  if (n >= 5)   return { pt: 6,  label: `物件/施設 ${n}` };
  if (n >= 1)   return { pt: 3,  label: `物件/施設 ${n}（少数）` };
  return { pt: 0, label: '物件/施設数 不明' };
}

function employeeScore(emp?: number | null): { pt: number; label: string } {
  if (emp == null) return { pt: 0, label: '従業員数 不明' };
  if (emp >= 300) return { pt: 10, label: `従業員 ${emp}名（大手）` };
  if (emp >= 100) return { pt: 8,  label: `従業員 ${emp}名` };
  if (emp >= 30)  return { pt: 5,  label: `従業員 ${emp}名` };
  if (emp >= 10)  return { pt: 3,  label: `従業員 ${emp}名（中小）` };
  return { pt: 1, label: `従業員 ${emp}名（小規模）` };
}

/* ── E. サービス親和性（最大5） ───────────────────────────── */
const HIGH_FIT: TargetSegment[] = ['mansion_kanri', 'fudosan_kanri', 'shogyo_shisetsu', 'kaigo', 'byoin'];

export function computeScore(c: CompanyInput): ScoreResult {
  const reasons: string[] = [];

  // 「営業お断り」は対象外（送信しない）
  if (c.salesRefused) {
    return { score: 0, reasons: ['「営業お断り」明記のため対象外（要確認）'], channel: 'hold' };
  }

  let score = 0;

  // A. セグメント
  const seg = SEGMENT_POINTS[c.segment];
  score += seg.pt;
  reasons.push(`+${seg.pt} ${seg.label}`);

  // B. 到達手段（メール最優先）＋ チャネル判定
  let channel: ContactChannel;
  if (c.hasContactEmail && c.emailIsPersonal) {
    score += 30; channel = 'email';
    reasons.push('+30 個別担当メールあり（最優先・到達性高）');
  } else if (c.hasContactEmail) {
    score += 24; channel = 'email';
    reasons.push('+24 問い合わせメールあり');
  } else if (c.hasContactForm) {
    score += 12; channel = 'form';
    reasons.push('+12 メール無し・フォームのみ（入力→送信前停止→人間確認）');
  } else {
    channel = 'hold';
    reasons.push('+0 到達手段なし（保留・要確認）');
  }
  if (c.hasContactEmail && c.hasContactForm) {
    score += 3;
    reasons.push('+3 メール・フォーム両方あり（予備経路確保）');
  }

  // C. 規模
  const fac = facilityScore(c.managedPropertyCount, c.facilityCount);
  score += fac.pt; reasons.push(`+${fac.pt} ${fac.label}`);
  const emp = employeeScore(c.employeeCount);
  score += emp.pt; reasons.push(`+${emp.pt} ${emp.label}`);

  // D. 地域
  const reg = regionScore(c.prefecture);
  score += reg.pt; reasons.push(`+${reg.pt} ${reg.label}`);

  // E. サービス親和性
  if (HIGH_FIT.includes(c.segment)) {
    score += 5; reasons.push('+5 施設管理サービス需要が明確');
  } else {
    score += 2; reasons.push('+2 施設管理需要は限定的');
  }

  // 上限100にクリップ
  if (score > 100) score = 100;

  return { score, reasons, channel };
}

/* ── セグメント優先順位（リスト並び替え・営業効果順） ───────── */
export const SEGMENT_PRIORITY: TargetSegment[] = [
  'mansion_kanri',
  'fudosan_kanri',
  'shogyo_shisetsu',
  'kaigo',
  'byoin',
  'clinic',
  'bilmen',
  'other',
];
