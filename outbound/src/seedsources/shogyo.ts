import { htmlSource } from './htmlSource.ts';

/**
 * 商業施設運営会社：日本ショッピングセンター協会 会員一覧など
 * ※安定CSVが見つかっていないため当面 HTML（後回し対象・URL/セレクタ要確定）。
 *   全国一覧→住所で都道府県フィルタする想定。
 */
export const shogyo = htmlSource({
  segment: 'shogyo_shisetsu',
  name: '日本ショッピングセンター協会 会員一覧（HTML・要調整）',
  homepage: 'https://www.jcsc.or.jp/',
  industry: '商業施設運営',
  liveListUrls: () => ['https://www.jcsc.or.jp/members/list?page=1'],
  demoFile: 'shogyo_tokyo.html',
});
