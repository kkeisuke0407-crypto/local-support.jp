/**
 * 国税庁 法人番号システム Web-API アダプタ（任意）
 * ------------------------------------------------------------------
 * 用途：社名＋都道府県から法人番号(corporate_number)を引き、重複排除に使う。
 *       ※このAPIは業種での絞り込みはできない（社名/法人番号/更新日での検索のみ）。
 *       セグメント別の母集団は協会名簿・公的DBから用意する（sources/seed.ts 参照）。
 *
 * 事前準備：
 *   1. https://www.houjin-bangou.nta.go.jp/ で利用申請しアプリケーションIDを取得
 *   2. 環境変数 HOUJIN_BANGOU_APP_ID にセット
 *
 * 注意：本環境はegress制限のため実行不可。ネットワークが開いた環境で使用すること。
 */
const ENDPOINT = 'https://api.houjin-bangou.nta.go.jp/4/name';

export interface HoujinResult {
  corporate_number: string;
  name: string;
  prefecture?: string;
  address?: string;
}

export async function lookupCorporateNumber(
  name: string,
  prefectureCode?: string, // JIS都道府県コード（例: 東京都=13）
): Promise<HoujinResult | null> {
  const appId = process.env.HOUJIN_BANGOU_APP_ID;
  if (!appId) {
    throw new Error('HOUJIN_BANGOU_APP_ID が未設定です（法人番号API利用申請が必要）');
  }
  const params = new URLSearchParams({
    id: appId,
    name,
    type: '12',          // CSV/Unicode
    mode: '2',           // 前方一致
  });
  if (prefectureCode) params.set('address', prefectureCode);

  try {
    const res = await fetch(`${ENDPOINT}?${params}`, {
      headers: { 'User-Agent': 'local-support-outbound/0.1' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    // CSV形式：先頭行に法人番号・商号などが入る。最初のヒットを採用。
    const first = text.split(/\r?\n/).find((l) => /^"?\d{13}/.test(l));
    if (!first) return null;
    const cols = first.split(',').map((c) => c.replace(/^"|"$/g, ''));
    return {
      corporate_number: cols[1] ?? cols[0] ?? '',
      name: cols[6] ?? name,
      prefecture: cols[9],
      address: (cols[9] ?? '') + (cols[10] ?? '') + (cols[11] ?? ''),
    };
  } catch {
    return null;
  }
}
