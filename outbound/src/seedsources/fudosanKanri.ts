import type { SeedSource, PrefRef } from './types.ts';
import { parseRows } from './parseUtil.ts';

/**
 * 不動産・ビル管理会社：賃貸住宅管理業者登録 / 賃貸管理ビジネス協会の会員一覧（公開）
 * ※実サイトのエンドポイント・マークアップは稼働時に要確認。
 */
export const fudosanKanri: SeedSource = {
  segment: 'fudosan_kanri',
  name: '賃貸住宅管理業者 登録一覧',
  homepage: 'https://www.mlit.go.jp/',
  liveListUrls(pref: PrefRef): string[] {
    return [`https://www.chintaikanri.jp/list?pref=${pref.code}&page=1`];
  },
  demo: { url: 'fixture://fudosan_kanri/tokyo', fixture: 'fixtures/fudosan_kanri_tokyo.html' },
  parseList(html, sourceUrl) {
    return parseRows(html, sourceUrl, {
      segment: 'fudosan_kanri',
      industry: '不動産・ビル管理',
      prefecture: '東京都',
    });
  },
};
