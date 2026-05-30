import type { SeedCompany } from '../types.ts';
import type { TargetSegment } from '../../config/scoring.ts';

/** URL → HTML（取得できなければ null）。本番=HTTP / デモ=fixture を差し替える */
export type FetchFn = (url: string) => Promise<string | null>;

export interface PrefRef {
  name: string; // '東京都'
  code: string; // JIS都道府県コード '13'
}

/** セグメント別の取得元アダプタ */
export interface SeedSource {
  segment: TargetSegment;
  name: string;       // 取得元の表示名
  homepage: string;   // 取得元トップ（記録用）
  /** 本番：都道府県に対するリストページURL（ページネーション分を配列で） */
  liveListUrls(pref: PrefRef): string[];
  /** デモ：fixtureファイルと、それに紐づくダミーURL */
  demo: { url: string; fixture: string };
  /** リストHTML → 企業配列（各レコードに seed_source_url を必ず付与） */
  parseList(html: string, sourceUrl: string): SeedCompany[];
}
