import fs from 'node:fs';
import path from 'node:path';
import { site } from './site';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

/**
 * サービス固有のOG画像（public/og-[slug].png）が存在すればそのURLを、
 * 無ければデフォルトOG画像のURLを返す。
 * 全27サービス分のOG画像が揃っていないため、未作成サービスでOGPが
 * 404にならないようビルド時にファイル存在を確認してフォールバックする。
 */
export function ogImageUrl(slug: string): string {
  const file = `og-${slug}.png`;
  return fs.existsSync(path.join(PUBLIC_DIR, file))
    ? `${site.domain}/${file}`
    : `${site.domain}/og-default.png`;
}
