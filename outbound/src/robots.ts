/**
 * robots.txt の最小限チェック。
 * User-agent: * の Disallow を見て、対象パスが許可されているかを返す。
 * 取得失敗時は「許可」とみなす（多くのサイトはrobots.txt未設置）。
 */
const cache = new Map<string, string[]>(); // origin → disallow paths

export async function isAllowed(targetUrl: string, ua = 'local-support-outbound'): Promise<boolean> {
  let origin: string;
  let path: string;
  try {
    const u = new URL(targetUrl);
    origin = u.origin;
    path = u.pathname || '/';
  } catch {
    return false;
  }

  let disallows = cache.get(origin);
  if (!disallows) {
    disallows = await fetchDisallows(origin, ua);
    cache.set(origin, disallows);
  }
  return !disallows.some((d) => d && path.startsWith(d));
}

async function fetchDisallows(origin: string, ua: string): Promise<string[]> {
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { 'User-Agent': ua },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const body = await res.text();
    return parseRobots(body, ua);
  } catch {
    return [];
  }
}

function parseRobots(body: string, ua: string): string[] {
  const lines = body.split(/\r?\n/).map((l) => l.replace(/#.*$/, '').trim());
  const groups: { agents: string[]; disallow: string[] }[] = [];
  let cur: { agents: string[]; disallow: string[] } | null = null;

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(':');
    if (!rest.length) continue;
    const key = rawKey.trim().toLowerCase();
    const val = rest.join(':').trim();
    if (key === 'user-agent') {
      if (!cur || cur.disallow.length) {
        cur = { agents: [], disallow: [] };
        groups.push(cur);
      }
      cur.agents.push(val.toLowerCase());
    } else if (key === 'disallow' && cur) {
      cur.disallow.push(val);
    }
  }

  const uaLower = ua.toLowerCase();
  const matched = groups.find((g) => g.agents.some((a) => uaLower.includes(a) && a !== '*'));
  const wildcard = groups.find((g) => g.agents.includes('*'));
  return (matched ?? wildcard)?.disallow ?? [];
}
