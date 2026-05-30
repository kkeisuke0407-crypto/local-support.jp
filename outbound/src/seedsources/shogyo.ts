import type { SeedSource, PrefRef } from './types.ts';
import { parseRows } from './parseUtil.ts';

/**
 * 商業施設運営会社：日本ショッピングセンター協会 会員一覧（公開）など
 * ※実サイトのマークアップは稼働時に要確認。
 */
export const shogyo: SeedSource = {
  segment: 'shogyo_shisetsu',
  name: '日本ショッピングセンター協会 会員一覧',
  homepage: 'https://www.jcsc.or.jp/',
  liveListUrls(_pref: PrefRef): string[] {
    // 商業施設運営は都道府県絞り込みが弱いため全国一覧→住所で都道府県フィルタする想定
    return ['https://www.jcsc.or.jp/members/list?page=1'];
  },
  demo: { url: 'fixture://shogyo/tokyo', fixture: 'fixtures/shogyo_tokyo.html' },
  parseList(html, sourceUrl) {
    return parseRows(html, sourceUrl, {
      segment: 'shogyo_shisetsu',
      industry: '商業施設運営',
      prefecture: '東京都',
    });
  },
};
