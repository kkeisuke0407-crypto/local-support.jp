// SVG の OG 画像を PNG にも書き出す。SVG OG を表示できない SNS/Slack 等への保険。
// 実行: node scripts/og-svg-to-png.mjs
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');

const files = (await fs.readdir(PUBLIC_DIR)).filter(
  (f) => f.startsWith('og-') && f.endsWith('.svg'),
);

for (const f of files) {
  const svgPath = path.join(PUBLIC_DIR, f);
  const pngPath = path.join(PUBLIC_DIR, f.replace(/\.svg$/, '.png'));
  const svg = await fs.readFile(svgPath);
  await sharp(svg, { density: 144 })
    .resize(1200, 630)
    .png({ quality: 90 })
    .toFile(pngPath);
  console.log(`✓ ${f} → ${path.basename(pngPath)}`);
}
console.log(`Done: ${files.length} file(s)`);
