/** リスト品質の指標算出（実行後にこれを見て改善方針を決める） */

export interface MetricRow {
  segment?: string;
  score?: number;
  contact_channel?: string;
  contact_email?: string;
  contact_form_url?: string;
  sales_refused?: boolean;
}

export interface Metrics {
  total: number;
  emailCount: number;        // メール取得できた件数（contact_email あり）
  formUrlCount: number;      // フォームURL取得できた件数（contact_form_url あり）
  manualCount: number;       // contact_channel === manual
  emailChannelCount: number; // contact_channel === email
  formChannelCount: number;  // contact_channel === form
  score80plus: number;
  score60plus: number;
  salesRefused: number;
  bySegment: Record<string, number>;
}

export interface RunStats {
  collected?: number;  // 取得元から収集した総数（重複排除前）
  deduped?: number;    // 重複排除後の数
}

export function computeMetrics(rows: MetricRow[]): Metrics {
  const m: Metrics = {
    total: rows.length, emailCount: 0, formUrlCount: 0, manualCount: 0,
    emailChannelCount: 0, formChannelCount: 0, score80plus: 0, score60plus: 0,
    salesRefused: 0, bySegment: {},
  };
  for (const r of rows) {
    if (r.contact_email) m.emailCount++;
    if (r.contact_form_url) m.formUrlCount++;
    const ch = r.contact_channel ?? 'manual';
    if (ch === 'email') m.emailChannelCount++;
    else if (ch === 'form') m.formChannelCount++;
    else m.manualCount++;
    const sc = r.score ?? 0;
    if (sc >= 80) m.score80plus++;
    if (sc >= 60) m.score60plus++;
    if (r.sales_refused) m.salesRefused++;
    if (r.segment) m.bySegment[r.segment] = (m.bySegment[r.segment] ?? 0) + 1;
  }
  return m;
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

export function formatMetrics(m: Metrics, stats?: RunStats): string {
  const L: string[] = [];
  L.push('──────── リスト品質レポート ────────');
  if (stats?.collected != null && stats?.deduped != null) {
    L.push(`収集総数        : ${stats.collected}`);
    L.push(`重複除外件数    : ${stats.collected - stats.deduped}（重複排除後 ${stats.deduped}）`);
  }
  L.push(`最終出力社数    : ${m.total}`);
  L.push('');
  L.push(`メール取得      : ${m.emailCount}  (${pct(m.emailCount, m.total)}%)`);
  L.push(`フォームURL取得 : ${m.formUrlCount}  (${pct(m.formUrlCount, m.total)}%)`);
  L.push(`manual          : ${m.manualCount}  (${pct(m.manualCount, m.total)}%)`);
  L.push(`  └ チャネル内訳: email=${m.emailChannelCount} / form=${m.formChannelCount} / manual=${m.manualCount}`);
  L.push('');
  L.push(`スコア80以上    : ${m.score80plus}  (${pct(m.score80plus, m.total)}%)`);
  L.push(`スコア60以上    : ${m.score60plus}  (${pct(m.score60plus, m.total)}%)`);
  L.push(`営業お断り検出  : ${m.salesRefused}`);
  L.push('');
  L.push(`セグメント別    : ${Object.entries(m.bySegment).map(([k, v]) => `${k}=${v}`).join(' / ') || '(なし)'}`);
  L.push('────────────────────────────────────');
  return L.join('\n');
}
