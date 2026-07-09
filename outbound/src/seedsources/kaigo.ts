import { csvSource } from './csvSource.ts';

/**
 * 介護施設運営会社：介護サービス情報公表システム（厚労省・全国）
 * 安定取得元：サイトでエリア/サービスを選び「CSV出力」したファイル、
 * または厚労省「介護事業所・生活関連情報検索」オープンデータCSV。
 *
 * 手元運用（live・csv-file）：
 *   都道府県コードのCSVを data/sources/kaigo_<code>.csv に置く（例 kaigo_13.csv）
 *   ※ ダウンロード手順は RUNBOOK 参照。
 *
 * 会社名は「法人名称」を優先（営業先＝運営法人単位）。法人番号で事業所→法人に重複排除される。
 */
export const kaigo = csvSource({
  segment: 'kaigo',
  name: '介護サービス情報公表システム（CSV）',
  homepage: 'https://www.kaigokensaku.mhlw.go.jp/',
  industry: '介護施設運営',
  liveFile: (pref) => `kaigo_${pref.code}.csv`,
  demoFile: 'kaigo_sample.csv',
  prefectureColumn: '都道府県名',
  column: {
    company_name: ['法人の名称', '法人名称', '法人名', '事業所名', '名称'],
    corporate_number: ['法人番号'],
    addressContains: ['住所', '所在地'],
    website_url: ['URL'],
  },
});
