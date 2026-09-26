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
    /** 表・本文の出典（公開料金表など）。ある場合は表の下に出典を表示し、県別の地域補正注記は出さない */
    sources?: { name: string; url: string; checked: string; detail?: string }[];
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

  /**
   * 実案件でセット依頼が多いサービス。見積フォームに「あわせて依頼が多いサービス」として
   * 最初から見える形で出し、1回の送信で複数サービスを依頼できるようにする。
   */
  bundleServiceSlugs?: string[];

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
      /**
       * その都道府県で実際に寄せられた相談（匿名化）と、業者の回答から分かったこと。
       * 他サイトにない一次情報として、県別ページを全国版の地名違いにしないための中核。
       * 依頼者・業者が特定できる情報（社名・番地・正確な面積）は書かない。
       */
      localCases?: {
        title: string;
        lead: string;
        cases: { label: string; facts: string; body: string }[];
        findings: { title: string; body: string }[];
      };
      /**
       * true のとき、全国版と同じ本文になるセクション（法令・放置リスク・業種別・失敗例・比較のコツ）を
       * 全国版へのリンク集に置き換える。県別ページの重複率を下げるため。
       */
      condenseCommonSections?: boolean;
      /** 都道府県ページ固有の title / description（未設定なら共通の定型文） */
      metaTitle?: string;
      metaDescription?: string;
    };
  };

  /**
   * このサービスに限ってインデックス対象に追加する都道府県スラグ。
   * PRIMARY_PREFECTURE_SLUGS（全サービス共通）に上乗せして、勝ち筋サービスだけ
   * 第2陣・第3陣の県を段階的に解放するための仕組み。
   * 追加する県は prefectures.ts で priceFactor / localFactors を拡充済みであること。
   */
  additionalIndexedPrefectures?: string[];
}
