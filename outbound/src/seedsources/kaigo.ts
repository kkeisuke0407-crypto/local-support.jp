import type { SeedSource, PrefRef } from './types.ts';
import { parseRows } from './parseUtil.ts';

/**
 * 介護施設運営会社：介護サービス情報公表システム（厚労省・全国）
 * ※都道府県コードでサブサイトが分かれる（例 /13/ = 東京都）。
 *   実サイトは検索結果がJS描画の場合があるため、稼働時にAPI/CSV出力の利用も検討。
 */
export const kaigo: SeedSource = {
  segment: 'kaigo',
  name: '介護サービス情報公表システム',
  homepage: 'https://www.kaigokensaku.mhlw.go.jp/',
  liveListUrls(pref: PrefRef): string[] {
    return [`https://www.kaigokensaku.mhlw.go.jp/${pref.code}/index.php?action_kouhyou_list=true&page=1`];
  },
  demo: { url: 'fixture://kaigo/tokyo', fixture: 'fixtures/kaigo_tokyo.html' },
  parseList(html, sourceUrl) {
    return parseRows(html, sourceUrl, {
      segment: 'kaigo',
      industry: '介護施設運営',
      prefecture: '東京都',
    });
  },
};
