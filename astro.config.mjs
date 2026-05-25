import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://local-support.jp',
  base: '/jusuisou-seisou',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  integrations: [sitemap()],
});
