#!/usr/bin/env node
/**
 * 事前ヒアリングページのURL生成ツール
 *
 * 使い方：
 *   node generate.mjs sample.json
 *   node generate.mjs sample.json --domain=https://local-support.jp
 *
 * 出力されるURLを依頼者にメールで送る。
 * 案件サマリー（案件ID・サービス・施設種類・依頼者情報）をURLハッシュに
 * base64で埋め込むため、サーバー側のストレージは不要。
 * 依頼者がヒアリングに回答すると /api/hearing 経由で運営にメールが届く。
 */
import fs from 'node:fs';

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

const errors = [];
if (!data.id) errors.push('id');
if (!data.service) errors.push('service');
if (errors.length) {
  console.error('ERROR: missing fields:', errors.join(', '));
  process.exit(1);
}

const json = JSON.stringify(data);
const b64 = Buffer.from(json, 'utf8').toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const url = `${DOMAIN}/hearing/#data=${b64}`;

console.log('───────────────────────────────');
console.log('案件ID:    ', data.id);
console.log('サービス:  ', data.service);
console.log('施設種類:  ', data.facilityType || '—');
console.log('依頼者:    ', (data.requester && data.requester.name) || '—');
console.log('URL長:     ', url.length, 'chars');
console.log('───────────────────────────────');
console.log('');
console.log('依頼者に共有するヒアリングURL:');
console.log('');
console.log(url);
console.log('');
console.log('───────────────────────────────');

if (url.length > 4000) {
  console.warn('⚠️  URL長が4,000文字を超えています。サマリー情報を簡潔にすると短縮できます。');
}
