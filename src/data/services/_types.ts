export interface ServiceData {
  slug: string;
  siteName: string;
  serviceName: string;
  serviceShortLabel: string;
  categoryKana: string;

  meta: {
    title: string;
    description: string;
    lastUpdated: string; // ISO date e.g. '2026-05-26'
  };

  /** AI検索引用用サマリー（ページ冒頭に配置・FAQPage補完） */
  aiSummary: {
    lead: string; // 2文程度の直接回答（定義・義務・相場を凝縮）
    facts: { label: string; value: string }[]; // 3〜4件のKey-Value事実
  };

  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    bullets: string[];
  };

  trustStats: { label: string; value: string }[];

  whyUs: { title: string; body: string }[];

  legal: {
    title: string;
    summary: string;
    alertTitle: string;
    alertBody: string;
    cards: { title: string; body: string; tags: string[] }[];
    legalBasis: string[];
  };

  risks: { title: string; body: string }[];

  costGuide: {
    intro: string;
    table: {
      caption: string;
      headers: string[];
      rows: string[][];
    };
    factors: string[];
    note: string;
    /** Offer/PriceSpecification 用の価格レンジ（JPY） */
    priceRange?: { min: number; max: number };
  };

  industries: { title: string; body: string; tag: string }[];

  selectionCriteria: { number: string; title: string; body: string }[];

  mistakes: { title: string; symptom: string; cause: string; prevention: string }[];

  comparisonTips: { title: string; body: string }[];

  faq: { q: string; a: string }[];

  formCustomField?: {
    label: string;
    name: string;
    options: string[];
  };
  facilityTypeOptions: string[];

  relatedServiceSlugs: string[];

  relatedColumns?: {
    href: string;
    category: string;
    title: string;
    excerpt: string;
    date: string;
  }[];

  /**
   * サービス × 都道府県の固有コンテンツ（キー = 都道府県slug）。
   * 都道府県ページが地名置換だけの重複（doorway）にならないよう、
   * インデックス対象の主要都府県にだけ固有の本文・相場表・FAQを持たせる。
   * 未設定の都道府県は共通コンテンツのみで描画する。
   */
  prefectureOverrides?: {
    [prefectureSlug: string]: {
      /** 都道府県固有の解説セクション（H2見出し + 段落本文） */
      localSection?: { title: string; paragraphs: string[] };
      /** 地域補正済みの費用相場表（共通 costGuide.table.rows を丸ごと置き換える） */
      costRows?: string[][];
      /** 共通FAQの末尾に追加する都道府県固有のFAQ */
      localFaq?: { q: string; a: string }[];
    };
  };
}
