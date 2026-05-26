export interface ServiceData {
  slug: string;
  siteName: string;
  serviceName: string;
  serviceShortLabel: string;
  categoryKana: string;

  meta: {
    title: string;
    description: string;
    lastUpdated: string; // ISO date e.g. '2025-05-26'
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
}
