import type { APIRoute } from 'astro';
import { columns } from '../data/columns';
import { site } from '../data/site';

export const prerender = true;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function pubDate(yyyy_mm_dd: string): string {
  const d = new Date(yyyy_mm_dd + 'T00:00:00+09:00');
  return d.toUTCString();
}

export const GET: APIRoute = () => {
  const sorted = [...columns].sort((a, b) => (a.date < b.date ? 1 : -1));
  const items = sorted.map((c) => {
    const url = `${site.domain}${c.href}`;
    return `    <item>
      <title>${escapeXml(c.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate(c.date)}</pubDate>
      <category>${escapeXml(c.category)}</category>
      <description>${escapeXml(c.excerpt)}</description>
    </item>`;
  }).join('\n');

  const buildDate = new Date().toUTCString();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.name)} コラム</title>
    <link>${site.domain}/column/</link>
    <atom:link href="${site.domain}/feed.xml" rel="self" type="application/rss+xml" />
    <description>施設管理・設備メンテナンスの費用相場・法定義務・業者選びの実務コラム（${site.name}）</description>
    <language>ja</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
