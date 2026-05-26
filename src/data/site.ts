export const site = {
  name: 'local-support.jp',
  domain: 'https://local-support.jp',
  tagline: '施設管理の一括見積比較',
  description:
    '受水槽清掃・アスベスト調査・ダクト清掃・シャッター点検など、施設管理に必要な専門業者を一括見積で比較できるB2B向け業者紹介サービス。',
  lastUpdated: '2025-05-26',
  stats: [
    { label: '累計相談件数', value: '5,000+' },
    { label: '登録業者数', value: '1,200社' },
    { label: '対応エリア', value: '全国47都道府県' },
    { label: '平均紹介社数', value: '最大3社' },
  ],
  org: {
    legalName: 'ローカル情報局',
  },
} as const;

export const serviceIndex = [
  {
    slug: 'jusuisou-seisou',
    name: '受水槽清掃',
    short: '受水槽',
    description: '水道法で年1回以上の清掃が義務付けられている貯水槽の専門業者を比較。',
  },
  {
    slug: 'asbestos',
    name: 'アスベスト調査・除去',
    short: 'アスベスト',
    description: '解体・改修工事前の事前調査と除去工事の有資格業者を比較。',
  },
  {
    slug: 'duct',
    name: 'ダクト清掃',
    short: 'ダクト',
    description: '厨房排気・空調ダクトの清掃で火災・衛生リスクを低減。',
  },
  {
    slug: 'shutter',
    name: 'シャッター点検・修理',
    short: 'シャッター',
    description: '防火シャッター・電動シャッターの定期点検と修理の専門業者を比較。',
  },
] as const;

export const prefectures = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県',
  '岐阜県','静岡県','愛知県','三重県',
  '滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県',
  '鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県',
  '福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県',
] as const;
