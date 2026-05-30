import type { SeedCompany } from '../types.ts';
import type { TargetSegment } from '../../config/scoring.ts';

/** URL → テキスト（HTML/CSV）。取得できなければ null */
export type FetchFn = (url: string) => Promise<string | null>;

export interface PrefRef {
  name: string; // '東京都'
  code: string; // JIS都道府県コード '13'
}

/** 取得元アダプタに渡す実行コンテキスト */
export interface LoadContext {
  pref: PrefRef;
  mode: 'live' | 'fixture';
  fetch: FetchFn;       // csv-url / html（live）用
  dataDir: string;      // csv-file（live）：手元にDLしたCSVの置き場（既定 data/sources）
  fixtureDir: string;   // デモ用fixtureの置き場（既定 fixtures）
}

/** 取得元の種類。安定度： csv-url ≈ csv-file ＞ html */
export type SourceKind = 'csv-url' | 'csv-file' | 'html';

/** セグメント別の取得元アダプタ */
export interface SeedSource {
  segment: TargetSegment;
  name: string;
  homepage: string;     // 取得元（記録用）
  kind: SourceKind;
  stable: boolean;      // 安定取得元か（CSV/API系=true, HTML系=false）
  /** 母集団を取得して SeedCompany[] を返す（各レコードに seed_source_url を付与） */
  load(ctx: LoadContext): Promise<SeedCompany[]>;
}
