import { htmlSource } from './htmlSource.ts';

/**
 * マンション管理会社：マンション管理業協会 会員一覧 / 国交省 登録業者一覧
 * ※安定CSVが見つかっていないため当面 HTML（後回し対象）。
 *   実サイトのHTMLサンプル入手後に liveListUrls / selectors を確定する。
 */
export const mansionKanri = htmlSource({
  segment: 'mansion_kanri',
  name: 'マンション管理業協会 会員一覧（HTML・要調整）',
  homepage: 'https://www.kanrikyo.or.jp/',
  industry: 'マンション管理業',
  liveListUrls: (pref) => [`https://www.kanrikyo.or.jp/member/search?pref=${pref.code}&page=1`],
  demoFile: 'mansion_kanri_tokyo.html',
});
