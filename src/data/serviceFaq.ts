import { quoteComparisonChecklist } from './quoteComparisonChecklist';
import type { ServiceData } from './services/_types';

type FaqItem = ServiceData['faq'][number];

interface BuildServiceFaqOptions {
  prefectureName?: string;
  additionalFaq?: ServiceData['faq'];
}

const yenFormatter = new Intl.NumberFormat('ja-JP');

const joinFirst = (items: string[], fallback: string) => {
  const values = items.map((item) => item.trim()).filter(Boolean).slice(0, 3);
  return values.length > 0 ? values.join('・') : fallback;
};

const formatPriceRange = (range?: ServiceData['costGuide']['priceRange']) => {
  if (!range) return null;
  return `${yenFormatter.format(range.min)}円〜${yenFormatter.format(range.max)}円`;
};

const uniqueFaq = (items: FaqItem[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.q.replace(/\s+/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const buildServiceFaq = (data: ServiceData, options: BuildServiceFaqOptions = {}): ServiceData['faq'] => {
  const { prefectureName, additionalFaq = [] } = options;
  const locationPrefix = prefectureName ? `${prefectureName}で` : '';
  const localizedServiceName = `${locationPrefix}${data.serviceName}`;
  const priceRange = formatPriceRange(data.costGuide.priceRange);
  const criteriaText = joinFirst(
    data.selectionCriteria.map((criterion) => criterion.title),
    '資格・実績・報告書の品質'
  );
  const costFactors = joinFirst(data.costGuide.factors, '作業範囲・設備規模・作業時間帯');
  const quoteChecks = joinFirst(
    quoteComparisonChecklist.map((item) => item.label),
    '作業範囲・追加費用・報告書'
  );
  const costGuideText = priceRange
    ? `費用目安は${priceRange}ですが、`
    : '費用は案件条件によって変わるため、';

  const generatedFaq: ServiceData['faq'] = [
    {
      q: `${localizedServiceName}の見積もり前に確認すべきことは何ですか？`,
      a: `${data.serviceName}では、対象設備・対象範囲・作業希望時期・立会い可否・報告書の必要有無を先に整理すると比較しやすくなります。特に${quoteChecks}は見積金額と作業品質に差が出やすいため、同じ条件で複数社に確認することが重要です。`,
    },
    {
      q: `${localizedServiceName}は何社くらい比較するとよいですか？`,
      a: `原則として2〜3社を比較すると、金額だけでなく作業範囲・資格対応・報告書内容・再対応条件の違いを確認しやすくなります。ロカサポでは条件に合う業者を最大5社まで紹介し、過度に多い見積もり対応で担当者の手間が増えないようにしています。`,
    },
    {
      q: `${localizedServiceName}の費用が相場より高くなる条件は何ですか？`,
      a: `${costGuideText}${costFactors}などの条件で総額が変わります。夜間・休日対応、緊急対応、追加報告書、特殊作業、駐車場代や出張費が別途になる場合もあるため、見積書では追加費用の扱いまで確認してください。`,
    },
    {
      q: `${localizedServiceName}の業者選びで重視すべきポイントは何ですか？`,
      a: `${data.serviceName}の業者選びでは、${criteriaText}を確認してください。安さだけで決めると、対象外作業・報告書不足・再対応条件の不明確さで結果的に手間や費用が増えることがあります。`,
    },
  ];

  return uniqueFaq([...data.faq, ...generatedFaq, ...additionalFaq]);
};
