#!/usr/bin/env node
/**
 * 業者比較ページのURL生成ツール
 *
 * 使い方：
 *   node generate.mjs sample.json
 *   node generate.mjs sample.json --domain=https://local-support.jp
 *
 * 出力されるURLを依頼者にメールで送信する。
 * 業者データはURL hash（fragment）に base64 で埋め込まれるため
 * サーバー側のストレージは不要。
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const dataPath = args.find((a) => !a.startsWith('--')) || 'sample.json';
const domainArg = args.find((a) => a.startsWith('--domain='));
const DOMAIN = domainArg ? domainArg.split('=')[1] : 'https://local-support.jp';

if (!fs.existsSync(dataPath)) {
  console.error(`ERROR: ${dataPath} not found`);
  console.error('Usage: node generate.mjs <data.json> [--domain=https://local-support.jp]');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 必須項目チェック
const errors = [];
if (!data.id) errors.push('id');
if (!data.service) errors.push('service');
if (!Array.isArray(data.vendors) || data.vendors.length === 0) errors.push('vendors (array, 1+)');
if (data.vendors && data.vendors.length > 5) errors.push('vendors should be max 5');
if (errors.length) {
  console.error('ERROR: missing/invalid fields:', errors.join(', '));
  process.exit(1);
}

// 各業者にidがなければ自動採番
data.vendors = data.vendors.map((v, i) => ({ ...v, id: v.id || `v${i + 1}` }));

// base64url エンコード
const json = JSON.stringify(data);
const b64 = Buffer.from(json, 'utf8').toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

const url = `${DOMAIN}/quote-result/#data=${b64}`;

console.log('───────────────────────────────');
console.log('案件ID:    ', data.id);
console.log('サービス:  ', data.service);
console.log('地域:      ', data.prefecture || '—');
console.log('依頼者:    ', (data.requester && data.requester.name) || '—');
console.log('業者数:    ', data.vendors.length);
console.log('業者ID:    ', data.vendors.map((v) => v.id).join(', '));
console.log('URL長:     ', url.length, 'chars');
console.log('───────────────────────────────');
console.log('');
console.log('依頼者に共有するURL:');
console.log('');
console.log(url);
console.log('');
console.log('───────────────────────────────');

// URLが長すぎる場合の警告
if (url.length > 6000) {
  console.warn('⚠️  URL長が6,000文字を超えています。一部メールクライアントで切れる可能性があります。');
  console.warn('   → 各業者の proposal や credentials を簡潔にすると短縮できます。');
}
