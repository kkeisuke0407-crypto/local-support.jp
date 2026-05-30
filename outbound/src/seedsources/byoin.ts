import { csvSource } from './csvSource.ts';

/**
 * 病院法人：医療機能情報提供制度（医療情報ネット・全国版）
 * 安定取得元：厚労省／各都道府県が公開する医療機能情報のオープンデータCSV。
 *
 * 手元運用（live・csv-file）：
 *   都道府県のCSVを data/sources/byoin_<code>.csv に置く（例 byoin_13.csv）
 *   ※ ダウンロード手順は RUNBOOK 参照。
 *
 * 会社名は「開設者名称（法人）」を優先（営業先＝運営法人）。
 */
export const byoin = csvSource({
  segment: 'byoin',
  name: '医療機能情報提供制度（CSV）',
  homepage: 'https://www.iryou.teikyouseido.mhlw.go.jp/',
  industry: '病院・医療法人',
  liveFile: (pref) => `byoin_${pref.code}.csv`,
  demoFile: 'byoin_sample.csv',
  column: {
    company_name: ['開設者名称', '開設者', '法人名称', '医療機関名称', '医療機関名', '名称'],
    corporate_number: ['法人番号'],
    addressContains: ['所在地', '住所'],
  },
});
