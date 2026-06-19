import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { allServices } from './src/data/services/index.ts';
import { PRIMARY_PREFECTURE_SLUGS } from './src/data/prefectures.ts';

// 主要都府県のみ sitemap に含める（noindex の都道府県を除外）
const PRIMARY_PREFS = [...PRIMARY_PREFECTURE_SLUGS];
const SERVICE_SLUGS = allServices.map((s) => s.slug);
const PREF_PAGE_RE = new RegExp(`\\/(${SERVICE_SLUGS.join('|')})\\/([^/]+)\\/`);
const SERVICE_TOP_RE = new RegExp(`^https:\\/\\/local-support\\.jp\\/(${SERVICE_SLUGS.join('|')})\\/$`);

// サービスごとの最終更新日を URL から引けるようにする（sitemap の lastmod に使う）
const LASTMOD_BY_SLUG = Object.fromEntries(
  allServices.map((s) => [s.slug, s.meta.lastUpdated]),
);
function lastmodForUrl(url) {
  const m = url.match(PREF_PAGE_RE) || url.match(SERVICE_TOP_RE);
  const slug = m && m[1];
  return (slug && LASTMOD_BY_SLUG[slug]) || undefined;
}

export default defineConfig({
  site: 'https://local-support.jp',
  trailingSlash: 'always',
  // ホバー時の次ページ先読み（Chromium 系の Speculation Rules を補完）
  // compressHTML はデフォルトで true、inlineStylesheets は CSS が大きいため未使用
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      filter: (page) => {
        if (page.includes('/thanks/')) return false;
        if (page.includes('/quote-result/')) return false;
        const m = page.match(PREF_PAGE_RE);
        if (m && !PRIMARY_PREFS.includes(m[2])) return false;
        return true;
      },
      serialize: (item) => {
        const lastmod = lastmodForUrl(item.url);
        const withLastmod = lastmod ? { lastmod } : {};
        // ホームページとサービスハブを高優先度に
        if (item.url === 'https://local-support.jp/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        if (SERVICE_TOP_RE.test(item.url)) {
          return { ...item, ...withLastmod, priority: 0.9, changefreq: 'monthly' };
        }
        // 主要都道府県ページ
        if (PREF_PAGE_RE.test(item.url)) {
          return { ...item, ...withLastmod, priority: 0.7, changefreq: 'monthly' };
        }
        return { ...item, priority: 0.5, changefreq: 'yearly' };
      },
    }),
  ],
});
