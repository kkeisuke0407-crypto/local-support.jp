import { htmlSource } from './htmlSource.ts';

/**
 * 不動産・ビル管理会社：賃貸住宅管理業者登録（国交省）の登録業者一覧
 * ※安定CSVが見つかっていないため当面 HTML（後回し対象・URL/セレクタ要確定）。
 */
export const fudosanKanri = htmlSource({
  segment: 'fudosan_kanri',
  name: '賃貸住宅管理業者 登録一覧（HTML・要調整）',
  homepage: 'https://etakken.mlit.go.jp/',
  industry: '不動産・ビル管理',
  liveListUrls: (pref) => [`https://etakken.mlit.go.jp/chintai/list?pref=${pref.code}&page=1`],
  demoFile: 'fudosan_kanri_tokyo.html',
});
