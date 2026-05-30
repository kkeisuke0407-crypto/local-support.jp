import { readFileSync } from 'node:fs';
import type { FetchFn } from './types.ts';
import { isAllowed } from '../robots.ts';

const UA = 'local-support-outbound/0.1 (+https://local-support.jp/)';

/** 本番：HTTP取得。robots.txt 尊重・タイムアウト・HTMLのみ。 */
export function httpFetch(ua = UA): FetchFn {
  return async (url: string) => {
    try {
      if (!(await isAllowed(url, ua))) {
        console.error(`  [robots] skip ${url}`);
        return null;
      }
      const res = await fetch(url, {
        headers: { 'User-Agent': ua, 'Accept-Language': 'ja' },
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      });
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('html') && !ct.includes('xml') && !ct.includes('text')) return null;
      return await res.text();
    } catch (e) {
      console.error(`  [fetch error] ${url}: ${(e as Error).message}`);
      return null;
    }
  };
}

/** デモ：URL→ローカルfixtureファイルへのマップ（ネットワーク不要）。 */
export function fixtureFetch(map: Map<string, string>): FetchFn {
  return async (url: string) => {
    const file = map.get(url);
    if (!file) return null;
    try {
      return readFileSync(file, 'utf8');
    } catch {
      return null;
    }
  };
}
