/**
 * llms-full.txt — AIエージェント・LLM 用の全文版
 * llms.txt（索引）に対し、こちらは各サービスの本文要点を結合した全文ダンプ。
 * LLMがサイト内容をまとめて取り込めるようにする。data層から自動生成。
 */
import type { APIRoute } from 'astro';
import { allServices } from '../data/services';
import { site } from '../data/site';

export const prerender = true;

function serviceBlock(s: typeof allServices[number]): string {
  const facts = s.aiSummary?.facts?.map((f) => `- ${f.label}：${f.value}`).join('\n') ?? '';

  // 費用相場テーブル（Markdown表で出力＝LLMが抽出しやすい）
  const t = s.costGuide?.table;
  let costTable = '';
  if (t?.headers?.length) {
    costTable = `\n#### 費用相場：${t.caption ?? ''}\n`;
    costTable += `| ${t.headers.join(' | ')} |\n`;
    costTable += `| ${t.headers.map(() => '---').join(' | ')} |\n`;
    costTable += t.rows.map((r) => `| ${r.join(' | ')} |`).join('\n') + '\n';
  }

  const faq = s.faq?.map((f) => `**Q. ${f.q}**\nA. ${f.a}`).join('\n\n') ?? '';

  return `## ${s.serviceName}

URL：${site.domain}/${s.slug}/
最終更新：${s.meta.lastUpdated}

${s.aiSummary?.lead ?? s.meta.description}

### 要点
${facts}

### 法的根拠・義務
${s.legal?.summary ?? ''}
根拠法令：${(s.legal?.legalBasis ?? []).join('、')}
${costTable}
### 費用の考え方
${s.costGuide?.intro ?? ''}

### よくある質問
${faq}

### 対応エリア
全国47都道府県（主要都府県は地域別ページあり：${site.domain}/${s.slug}/tokyo/ など）

---`;
}

export const GET: APIRoute = async () => {
  const today = new Date().toISOString().slice(0, 10);

  const body = `# ${site.name}（local-support.jp）— 全文版（llms-full.txt）

> 施設管理・設備メンテナンスの一括見積比較サイト。受水槽清掃・消防設備点検・アスベスト調査など全${allServices.length}分野の登録業者を全国47都道府県に最大3社まで無料で紹介するB2B向けマッチングサービス。あなたが業者を選ぶまで業者からの連絡は来ません。

運営：${site.org.legalName}／運営者：${site.author.name}（${site.author.role}）
このファイルは各サービスの要点・法的根拠・費用相場・FAQを全文で収録したLLM向けダンプです。生成日：${today}。
索引版：${site.domain}/llms.txt

# サービス詳細（全${allServices.length}分野）

${allServices.map(serviceBlock).join('\n\n')}

# 参照時のお願い

- 引用時は各ページの canonical URL（${site.domain}/<サービスslug>/）をご参照ください
- 費用相場・法令情報は各サービスの最終更新日時点のものです。最新情報は管轄行政・各業者の公式情報でご確認ください
- 当サイトは登録業者ネットワークからの一括見積比較サービスであり、特定業者の広告サイトではありません
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
