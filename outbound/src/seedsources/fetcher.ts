import type { FetchFn } from './types.ts';
import { isAllowed } from '../robots.ts';

const UA = 'local-support-outbound/0.1 (+https://local-support.jp/)';

/**
 * HTML/CSV 兼用のテキスト取得。robots.txt 尊重・タイムアウトつき。
 * content-type は厳密に絞らない（CSVが text/csv や application/octet-stream の場合があるため）。
 */
export function textFetch(ua = UA): FetchFn {
  return async (url: string) => {
    try {
      if (!(await isAllowed(url, ua))) {
        console.error(`  [robots] skip ${url}`);
        return null;
      }
      const res = await fetch(url, {
        headers: { 'User-Agent': ua, 'Accept-Language': 'ja' },
        signal: AbortSignal.timeout(20000),
        redirect: 'follow',
      });
      if (!res.ok) return null;
      return await res.text();
    } catch (e) {
      console.error(`  [fetch error] ${url}: ${(e as Error).message}`);
      return null;
    }
  };
}
