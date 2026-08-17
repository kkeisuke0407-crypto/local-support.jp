// 各サービスの OG 画像 SVG を serviceIndex から生成する。
// 既存の手作りSVG（9サービス + default）は上書きしない。
// 実行: node scripts/gen-og-svg.mjs  → その後 node scripts/og-svg-to-png.mjs
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const SITE_TS = path.resolve(__dirname, '../src/data/site.ts');

// site.ts から serviceIndex（slug / name / short）を抽出
const siteSrc = await fs.readFile(SITE_TS, 'utf8');
const services = [];
const re = /slug:\s*'([^']+)',\s*\n\s*name:\s*'([^']+)',\s*\n\s*short:\s*'([^']+)'/g;
let m;
while ((m = re.exec(siteSrc)) !== null) {
  services.push({ slug: m[1], name: m[2], short: m[3] });
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 大見出しのフォントサイズを文字数で調整（はみ出し防止）
function headlineSize(text) {
  const n = [...text].length;
  if (n <= 5) return 76;
  if (n <= 7) return 64;
  if (n <= 9) return 54;
  return 46;
}

function buildSvg({ name, short }) {
  const headline = short.length <= 10 ? short : short.slice(0, 10);
  const fs1 = headlineSize(headline);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0c4a6e"/>
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect x="0" y="0" width="1200" height="8" fill="#f59e0b"/>
  <text x="80" y="110" font-family="'Helvetica Neue', Arial, sans-serif" font-size="36" font-weight="700" fill="#f59e0b" letter-spacing="-0.5">ロカサポ</text>
  <line x1="200" y1="98" x2="220" y2="98" stroke="#f59e0b" stroke-width="2"/>
  <text x="240" y="110" font-family="'Helvetica Neue', Arial, sans-serif" font-size="24" font-weight="400" fill="rgba(255,255,255,0.7)">施設管理の一括見積比較</text>
  <text x="80" y="240" font-family="'Helvetica Neue', Arial, sans-serif" font-size="${fs1}" font-weight="900" fill="#ffffff" letter-spacing="-2">${esc(headline)}</text>
  <rect x="80" y="265" width="120" height="5" fill="#f59e0b" rx="2"/>
  <text x="80" y="335" font-family="'Helvetica Neue', Arial, sans-serif" font-size="30" font-weight="700" fill="#93c5fd">${esc(name)}の業者を一括見積比較</text>
  <text x="80" y="400" font-family="'Helvetica Neue', Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.75)">資格・許認可を確認した専門業者を厳選</text>
  <rect x="80" y="460" width="280" height="56" rx="28" fill="#f59e0b"/>
  <text x="220" y="495" font-family="'Helvetica Neue', Arial, sans-serif" font-size="20" font-weight="700" fill="#1e293b" text-anchor="middle">無料で一括見積もり依頼</text>
  <text x="80" y="565" font-family="'Helvetica Neue', Arial, sans-serif" font-size="16" fill="rgba(255,255,255,0.5)">完全無料 ｜ 最大5社を比較 ｜ 全国47都道府県対応</text>
  <g transform="translate(960, 240)">
    <path d="M75 10 L140 35 L140 90 C140 130 75 160 75 160 C75 160 10 130 10 90 L10 35 Z" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" stroke-width="3"/>
    <path d="M48 85 L67 104 L102 67" stroke="#f59e0b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
</svg>
`;
}

let created = 0, skipped = 0;
for (const svc of services) {
  const svgPath = path.join(PUBLIC_DIR, `og-${svc.slug}.svg`);
  try {
    await fs.access(svgPath);
    skipped++; // 既存（手作り）は触らない
    continue;
  } catch { /* not exists → create */ }
  await fs.writeFile(svgPath, buildSvg(svc), 'utf8');
  created++;
  console.log(`✓ og-${svc.slug}.svg 生成`);
}
console.log(`Done: ${created} 生成 / ${skipped} 既存スキップ（計${services.length}サービス）`);
