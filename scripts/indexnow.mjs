// IndexNow で更新URLを Bing などへ通知する。
//   node scripts/indexnow.mjs --from <sha> --to <sha>   … 2コミット間で変わったページだけ送る
//   node scripts/indexnow.mjs --all                     … 公開中の sitemap の全URLを送る
//   --dry-run を付けると送信せずに対象URLだけ表示する
// main への push 後に .github/workflows/indexnow.yml から実行される。
// 全URLを送り直したいときは、コミットメッセージに [indexnow-all] を含めて main に push する。
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const HOST = 'local-support.jp';
const ORIGIN = `https://${HOST}`;
const KEY = '77dded00e4d205efe7e77527fcd8359b';
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;
const PRIMARY_PREFS = ['tokyo', 'osaka', 'aichi', 'kanagawa', 'fukuoka', 'saitama'];

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const dryRun = args.includes('--dry-run');

function indexedPrefsFor(serviceSlug) {
  const file = `src/data/services/${serviceSlug}.ts`;
  if (!fs.existsSync(file)) return PRIMARY_PREFS;
  const m = fs.readFileSync(file, 'utf8').match(/additionalIndexedPrefectures:\s*\[([^\]]*)\]/);
  const extra = m ? [...m[1].matchAll(/'([a-z]+)'/g)].map((x) => x[1]) : [];
  return [...PRIMARY_PREFS, ...extra];
}

function urlsFromDiff(from, to) {
  const files = execSync(`git diff --name-only ${from} ${to}`, { encoding: 'utf8' }).split('\n').filter(Boolean);
  const urls = new Set();
  for (const f of files) {
    let m;
    if ((m = f.match(/^src\/pages\/column\/([^/[]+)\/index\.astro$/))) {
      urls.add(`${ORIGIN}/column/${m[1]}/`);
    } else if ((m = f.match(/^src\/data\/services\/([a-z0-9-]+)\.ts$/)) && !m[1].startsWith('_') && m[1] !== 'index') {
      urls.add(`${ORIGIN}/${m[1]}/`);
      for (const p of indexedPrefsFor(m[1])) urls.add(`${ORIGIN}/${m[1]}/${p}/`);
    } else if ((m = f.match(/^src\/pages\/([a-z0-9-]+)\/index\.astro$/))) {
      urls.add(`${ORIGIN}/${m[1]}/`);
    } else if (f === 'src/pages/index.astro') {
      urls.add(`${ORIGIN}/`);
    }
  }
  return [...urls];
}

async function urlsFromSitemap() {
  const index = await (await fetch(`${ORIGIN}/sitemap-index.xml`)).text();
  const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const urls = [];
  for (const map of maps) {
    const xml = await (await fetch(map)).text();
    urls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  }
  return urls;
}

const urlList = args.includes('--all')
  ? await urlsFromSitemap()
  : urlsFromDiff(opt('--from') ?? 'HEAD~1', opt('--to') ?? 'HEAD');

if (urlList.length === 0) {
  console.log('[indexnow] 通知するURLはありません');
  process.exit(0);
}
console.log(`[indexnow] ${urlList.length}件`);
urlList.forEach((u) => console.log('  ' + u));
if (dryRun) process.exit(0);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urlList.slice(0, 10000) }),
});
console.log(`[indexnow] HTTP ${res.status} ${res.statusText}`);
// 200: 受理 / 202: 受理（鍵の確認待ち）
if (res.status !== 200 && res.status !== 202) {
  console.log(await res.text());
  process.exit(1);
}
