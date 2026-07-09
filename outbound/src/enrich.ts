import type { SeedCompany, EnrichedCompany } from './types.ts';
import { extractContacts } from './extract.ts';
import { isAllowed } from './robots.ts';

const UA = 'local-support-outbound/0.1 (+https://local-support.jp/)';

/** 候補となる問い合わせページのパス（トップで取れなかった場合に巡回） */
const CONTACT_PATHS = ['/contact/', '/contact', '/inquiry/', '/contact.html', '/company/contact/', '/お問い合わせ/'];

async function getHtml(url: string): Promise<string | null> {
  try {
    if (!(await isAllowed(url, UA))) return null;
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'ja' },
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('html')) return null;
    return await res.text();
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface EnrichOptions {
  fetch: boolean;          // false なら seed の値をそのまま使う（オフライン実証）
  perRequestDelayMs: number; // 同一ドメインへの礼儀的ディレイ
}

/**
 * 1社をエンリッチ。メール最優先。
 *  - トップ→問い合わせページの順に巡回してメール／フォーム／電話を抽出
 *  - robots.txt 不許可ページはスキップ
 */
export async function enrichCompany(seed: SeedCompany, opt: EnrichOptions): Promise<EnrichedCompany> {
  const now = new Date().toISOString();
  const base: EnrichedCompany = {
    ...seed,
    collected_at: now,
    robots_allowed: true,
    sales_refused: seed.sales_refused ?? false,
    email_source: seed.contact_email ? 'directory' : '',
  };

  // --no-fetch：seedの値をそのまま採用（パイプライン実証用）
  if (!opt.fetch) {
    base.source_url = seed.website_url ?? '';
    base.email_is_personal = seed.contact_email
      ? /[._]/.test(seed.contact_email.split('@')[0])
      : undefined;
    return base;
  }

  if (!seed.website_url) {
    // URLが無い場合は今回は manual 行きにする（検索による発見は別アダプタで対応）
    base.robots_allowed = true;
    return base;
  }

  const pages = [seed.website_url, ...CONTACT_PATHS.map((p) => safeJoin(seed.website_url!, p))];
  const tried = new Set<string>();

  for (const url of pages) {
    if (tried.has(url)) continue;
    tried.add(url);

    const html = await getHtml(url);
    await sleep(opt.perRequestDelayMs);
    if (html === null) {
      // robots不許可 or 取得失敗。トップが不許可なら robots_allowed=false 記録
      if (url === seed.website_url && !(await isAllowed(url, UA))) base.robots_allowed = false;
      continue;
    }

    const r = extractContacts(html, url);
    if (r.salesRefused) base.sales_refused = true;

    if (r.email && !base.contact_email) {
      base.contact_email = r.email;
      base.email_is_personal = r.emailIsPersonal;
      base.email_source = 'website';
      base.source_url = url;
    }
    if (r.formUrl && !base.contact_form_url) base.contact_form_url = r.formUrl;
    if (r.phone && !base.phone) base.phone = r.phone;

    // メールが取れたら以降のページ巡回は不要（メール最優先）
    if (base.contact_email) break;
  }

  if (!base.source_url) base.source_url = seed.website_url ?? '';
  return base;
}

function safeJoin(base: string, path: string): string {
  try {
    return new URL(path, base).toString();
  } catch {
    return base;
  }
}
