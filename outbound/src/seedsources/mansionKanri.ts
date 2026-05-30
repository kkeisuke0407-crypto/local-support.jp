import type { SeedSource, PrefRef } from './types.ts';
import { parseRows } from './parseUtil.ts';

/**
 * マンション管理会社：マンション管理業協会 会員/登録業者一覧（公開）
 * ※実サイトのエンドポイント・マークアップは稼働時に要確認（セレクタ調整）。
 */
export const mansionKanri: SeedSource = {
  segment: 'mansion_kanri',
  name: 'マンション管理業協会 会員一覧',
  homepage: 'https://www.kanrikyo.or.jp/',
  liveListUrls(pref: PrefRef): string[] {
    // 例：都道府県コードでフィルタした会員検索結果ページ（ページ送り対応）
    return [`https://www.kanrikyo.or.jp/member/search?pref=${pref.code}&page=1`];
  },
  demo: { url: 'fixture://mansion_kanri/tokyo', fixture: 'fixtures/mansion_kanri_tokyo.html' },
  parseList(html, sourceUrl) {
    return parseRows(html, sourceUrl, {
      segment: 'mansion_kanri',
      industry: 'マンション管理業',
      prefecture: '東京都',
    });
  },
};
