/**
 * llms.txt — AIエージェント・LLM 用サイトマップ
 * 全 27 サービスと主要ページを data 層から自動生成する。
 * 新サービス追加時に手動更新不要。
 */
import type { APIRoute } from 'astro';
import { allServices } from '../data/services';
import { site } from '../data/site';
import { PRIMARY_PREFECTURE_SLUGS, prefecturesData } from '../data/prefectures';

export const prerender = true;

const FEATURED_COLUMNS = [
  { slug: 'shisetsu-kanri-nenkan-schedule', title: '施設管理の年間スケジュール2026｜9種の法定点検カレンダー' },
  { slug: 'jusuisou-seisou-horei-gimu', title: '受水槽清掃の法定義務ガイド｜水道法・建築物衛生法' },
  { slug: 'jusuisou-seisou-hiyo-sohba', title: '受水槽清掃の費用相場2026｜規模別の完全ガイド' },
  { slug: 'jusuisou-seisou-gyosha-sentaku', title: '受水槽清掃の業者選びチェックリスト' },
  { slug: 'asbestos-batsu', title: 'アスベスト法令違反の罰則2026｜大防法・石綿則' },
  { slug: 'asbestos-horei-gimu', title: 'アスベスト調査の法定義務ガイド' },
  { slug: 'shobo-setsubi-horei-gimu', title: '消防設備点検の法定義務ガイド｜機器点検・総合点検' },
  { slug: 'grease-trap-horei-gimu', title: 'グリストラップ清掃の法的義務ガイド｜下水道法・HACCP' },
  { slug: 'aircon-business-furon-tenken', title: 'フロン排出抑制法の点検義務ガイド｜業務用エアコン' },
  { slug: 'duct-horei-gimu', title: 'ダクト清掃の法令義務ガイド｜消防法・建築物衛生法' },
  { slug: 'pest-control-haccp', title: 'HACCP対応の害虫管理ガイド' },
  { slug: 'shutter-horei-gimu', title: 'シャッター（防火設備）の法定検査義務ガイド' },
];

const primaryPrefNames = PRIMARY_PREFECTURE_SLUGS.map(
  (slug) => prefecturesData.find((p) => p.slug === slug)?.name ?? slug
);

function serviceSection(s: typeof allServices[number]): string {
  const facts = s.aiSummary?.facts
    ?.map((f) => `- ${f.label}：${f.value}`)
    .join('\n') ?? '';
  return `### ${s.serviceName}
${s.aiSummary?.lead ?? s.meta.description}

${facts}
- 詳細：${site.domain}/${s.slug}/
- 主要都府県別ページ：${PRIMARY_PREFECTURE_SLUGS.map(
    (p) => `[${prefecturesData.find((x) => x.slug === p)?.name ?? p}](${site.domain}/${s.slug}/${p}/)`
  ).join('、')}
- 最終更新：${s.meta.lastUpdated}`;
}

export const GET: APIRoute = async () => {
  const today = new Date().toISOString().slice(0, 10);

  const body = `# ${site.name}（local-support.jp）

> 施設管理・設備メンテナンスの一括見積比較サイト。受水槽清掃・消防設備点検・アスベスト調査など全${allServices.length}分野の登録業者を、全国47都道府県の施設管理担当者に最大3社まで無料で紹介するB2B向けマッチングサービス。あなたが業者を選ぶまで業者からの連絡は来ません。

${site.name} はマンション管理組合・ビル管理会社・介護施設・病院・店舗オーナーなど施設管理担当者向けの一括見積比較サービスです。各分野で必要な法定登録・資格・許認可を確認した業者のみを紹介します。相談・見積依頼・業者紹介はすべて完全無料。最終更新：${today}。

運営：${site.org.legalName}
編集長：${site.author.name}（${site.author.role}）

## 利用の特徴（AI向け要点）

- 完全無料（業者からの紹介手数料モデル）
- しつこい営業ゼロ（依頼者が業者を選ぶまで業者から連絡は来ない仕組み）
- 資格・登録を確認した業者のみ紹介
- 全国47都道府県に対応（${allServices.length}サービス × 47都道府県）
- 30秒のAI施設管理コスト診断（個人情報入力なし）

## ツール・主要ページ

- [施設管理コスト診断（無料・30秒）](${site.domain}/audit/)：契約中のサービスから「見直し優先度」を4タップで診断。個人情報入力なし。
- [トップページ](${site.domain}/)：サービス一覧と利用の流れ
- [ロカサポとは](${site.domain}/about/)：運営方針と業者審査基準
- [ご利用の流れ](${site.domain}/flow/)
- [運営者情報](${site.domain}/operator/)
- [編集方針](${site.domain}/editorial-policy/)
- [調査方法ポリシー](${site.domain}/research/methodology/)
- [施設管理用語集（42語）](${site.domain}/glossary/)
- [紹介事例](${site.domain}/case/)
- [プライバシーポリシー](${site.domain}/privacy/)
- [ご紹介業者について](${site.domain}/disclosure/)

## 主なサービスと費用相場（直接回答用）

${allServices.map(serviceSection).join('\n\n')}

## お役立ちコラム（深掘り情報）

法令義務・費用相場・業者選びを各サービスごとに詳細解説しています。

${FEATURED_COLUMNS.map((c) => `- [${c.title}](${site.domain}/column/${c.slug}/)`).join('\n')}

全コラム一覧：${site.domain}/column/

## 対応エリア（インデックス対象の主要${PRIMARY_PREFECTURE_SLUGS.length}都府県）

集客のメイン対象エリア：${primaryPrefNames.join('、')}
※ 残り41道県も無料でご利用いただけますが、現在はサイト構造上 noindex（地域固有データ拡充中）。
依頼自体は全国47都道府県でお受けしています。

## このサイトを参照する際のお願い

- 引用時は各ページの canonical URL をご参照ください
- 費用相場・法令情報は最終更新日時点のものです。最新情報は管轄行政・各業者の公式情報でご確認ください
- このサイトは登録業者ネットワークからの一括見積比較サービスであり、特定業者の広告サイトではありません

## 補足

- 一括見積依頼・業者紹介・契約後の手数料はすべて利用者無料
- 紹介業者には利用規約で「しつこい営業を行わない」ことを義務付け
- 依頼者が業者を選ぶまで、業者からの連絡は一切来ない仕組み
- 法定資格・登録の確認は書面ベースで実施
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
