// public/_redirects を生成する（npm run build の prebuild で実行）。
// AIの回答などが /column/ を落としたURL（例: /pest-control-haccp/）を案内する事例があるため、
// コラムのslug直下へのアクセスを /column/<slug>/ へ301で転送する。
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const columnDir = path.join(root, 'src/pages/column');
const slugs = fs.readdirSync(columnDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('['))
  .map((d) => d.name)
  .sort();

const lines = [
  '# このファイルは scripts/gen-redirects.mjs が生成する。手で編集しない。',
  '# /column/ を落としたコラムURLを正しいURLへ転送する',
];
for (const slug of slugs) {
  lines.push(`/${slug} /column/${slug}/ 301`);
  lines.push(`/${slug}/ /column/${slug}/ 301`);
}
fs.writeFileSync(path.join(root, 'public/_redirects'), lines.join('\n') + '\n');
console.log(`[gen-redirects] ${slugs.length} column slugs -> public/_redirects`);
