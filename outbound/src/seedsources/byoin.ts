import type { SeedSource, PrefRef } from './types.ts';
import { parseRows } from './parseUtil.ts';

/**
 * 病院法人：医療機能情報提供制度（医療情報ネット）/ 病院名簿
 * ※都道府県別の検索結果。稼働時にエンドポイント・マークアップ要確認。
 */
export const byoin: SeedSource = {
  segment: 'byoin',
  name: '医療情報ネット（医療機能情報提供制度）',
  homepage: 'https://www.iryou.teikyouseido.mhlw.go.jp/',
  liveListUrls(pref: PrefRef): string[] {
    return [`https://www.iryou.teikyouseido.mhlw.go.jp/znk-web/juminkanja/S2300/search?pref=${pref.code}&type=hospital&page=1`];
  },
  demo: { url: 'fixture://byoin/tokyo', fixture: 'fixtures/byoin_tokyo.html' },
  parseList(html, sourceUrl) {
    return parseRows(html, sourceUrl, {
      segment: 'byoin',
      industry: '病院・医療法人',
      prefecture: '東京都',
    });
  },
};
