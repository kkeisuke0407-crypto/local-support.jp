import * as cheerio from 'cheerio';

/** よくある「営業お断り」表現 */
const SALES_REFUSED_PATTERNS = [
  '営業目的', '営業お断り', '営業の', '勧誘お断り', '勧誘目的',
  'セールス', '売り込み', 'no soliciting', '営業メールお断り',
];

/** 問い合わせフォームへ向かうリンクの手掛かり */
const CONTACT_HINTS = [
  'contact', 'inquiry', 'enquiry', 'toiawase', 'otoiawase',
  'お問い合わせ', '問い合わせ', 'お問合せ', '問合せ', 'ご相談', 'フォーム',
];

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// 日本の電話番号（市外局番つき・フリーダイヤル含む、ざっくり）
const PHONE_RE = /0(?:\d{1,4}-\d{1,4}-\d{3,4}|\d{9,10})|0120-?\d{2,3}-?\d{3,4}/g;

/** 個別担当アドレスっぽいか（info@ 等の代表アドレスは false 寄り） */
const GENERIC_LOCALPARTS = ['info', 'contact', 'support', 'mail', 'office', 'inquiry', 'webmaster', 'admin'];

/** 明らかにダミー/プレースホルダなメール（テンプレ流用や雛形で残ったもの） */
const DUMMY_EMAIL_PATTERNS: RegExp[] = [
  // ローカル部の典型
  /^(sample|example|test|demo|dummy|hoge|fuga|foo|bar|baz|aaa+|bbb+|xxx+|yyy+|zzz+|abc|name|user|noreply|no-reply|donotreply|do-not-reply)@/i,
  /^[a-z]@/i,                 // 1文字ローカル
  /^(.)\1{2,}@/i,              // sssss@ など同一文字連続
  // ドメイン側の典型（プレースホルダ）
  /@(example\.(com|net|org|jp|co\.jp)|sample\.(com|co\.jp)|test\.(com|co\.jp)|domain\.(com|co\.jp)|your-?site\.\w+|your-?domain\.\w+|mysite\.\w+|maru\.com|form\.jp|xxx?\.\w+)$/i,
  // Sentry/監視SDKが埋め込むトラッキング用ダミー
  /sentry[-_]?(next|test|prod)?\.wixpress\.com$/i,
  /@sentry\./i,
  /@.*\.example\./i,
];

export function isDummyEmail(email: string): boolean {
  return DUMMY_EMAIL_PATTERNS.some((re) => re.test(email));
}

export function isPersonalEmail(email: string): boolean {
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  if (GENERIC_LOCALPARTS.includes(local)) return false;
  // 氏名っぽい（ドットや数字を含む個人名形式）ならpersonal寄り
  return /[._]/.test(local) || /^[a-z]+\d{0,3}$/.test(local) === false;
}

export interface ExtractResult {
  email?: string;
  emailIsPersonal?: boolean;
  formUrl?: string;
  phone?: string;
  salesRefused: boolean;
}

/**
 * HTMLから連絡先を抽出。
 * メール最優先：mailto: → 本文中のメール の順で拾う。
 * メールが無ければ問い合わせフォームURLを拾う。
 */
export function extractContacts(html: string, baseUrl: string): ExtractResult {
  const $ = cheerio.load(html);
  const text = $('body').text();

  const salesRefused = SALES_REFUSED_PATTERNS.some((p) => text.includes(p));

  // 1) mailto: を最優先
  let email: string | undefined;
  $('a[href^="mailto:"]').each((_, el) => {
    if (email) return;
    const href = $(el).attr('href') || '';
    const m = href.replace(/^mailto:/, '').split('?')[0].trim();
    if (m && EMAIL_RE.test(m) && !isDummyEmail(m)) email = m;
    EMAIL_RE.lastIndex = 0;
  });

  // 2) 本文中のメール表記
  if (!email) {
    const hits = html.match(EMAIL_RE) || [];
    // 画像/CDN拡張子の誤検出・ダミーメールを除外
    const clean = hits.filter((e) => !/\.(png|jpe?g|gif|webp|svg|css|js)$/i.test(e) && !isDummyEmail(e));
    if (clean.length) email = clean[0];
  }

  // 3) 問い合わせフォームURL（メールが取れていても予備として拾う）
  let formUrl: string | undefined;
  $('a[href]').each((_, el) => {
    if (formUrl) return;
    const href = $(el).attr('href') || '';
    const label = ($(el).text() || '') + ' ' + href;
    if (CONTACT_HINTS.some((h) => label.toLowerCase().includes(h.toLowerCase()))) {
      try {
        formUrl = new URL(href, baseUrl).toString();
      } catch {
        /* ignore */
      }
    }
  });

  // 4) 電話番号
  const phoneHits = html.replace(/<[^>]+>/g, ' ').match(PHONE_RE) || [];
  const phone = phoneHits[0];

  return {
    email,
    emailIsPersonal: email ? isPersonalEmail(email) : undefined,
    formUrl,
    phone,
    salesRefused,
  };
}
