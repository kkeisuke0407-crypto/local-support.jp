export const site = {
  name: 'ロカサポ',
  domain: 'https://local-support.jp',
  tagline: '施設管理の一括見積比較',
  description:
    '受水槽清掃・アスベスト調査・ダクト清掃・シャッター点検など、施設管理に必要な専門業者を一括見積で比較できるB2B向け業者紹介サービス。',
  lastUpdated: '2026-05-26',
  stats: [
    { label: '紹介可能業者数', value: '1,200社' },
    { label: '対応エリア', value: '全国47都道府県' },
    { label: '平均紹介社数', value: '最大5社' },
  ],
  org: {
    legalName: 'ローカル情報局',
  },
  author: {
    name: '寺尾聡',
    role: '運営者・施設管理情報担当',
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
  {
    slug: 'shobo-setsubi',
    name: '消防設備点検',
    short: '消防設備',
    description: '消防法で義務化されている機器点検・総合点検を有資格業者へ一括見積。',
  },
  {
    slug: 'grease-trap',
    name: 'グリストラップ清掃',
    short: 'グリストラップ',
    description: '飲食店・厨房施設のグリストラップ清掃を許可業者へ一括見積。',
  },
  {
    slug: 'aircon-business',
    name: '業務用エアコン洗浄・修理',
    short: '業務用エアコン',
    description: '店舗・オフィスの業務用エアコン洗浄・修理を有資格業者へ一括見積。',
  },
  {
    slug: 'pest-control',
    name: '害虫駆除（業務用PCO）',
    short: '害虫駆除',
    description: '飲食・食品・福祉施設のHACCP対応害虫駆除を専門業者へ一括見積。',
  },
  {
    slug: 'signboard-inspection',
    name: '看板・屋外広告物点検',
    short: '看板点検',
    description: '屋外広告物条例に基づく看板の安全点検を有資格業者へ一括見積。',
  },
  {
    slug: 'jikayou-denki',
    name: '自家用電気工作物点検（キュービクル点検）',
    short: '電気工作物点検',
    description: '電気事業法で義務付けられたキュービクル・受変電設備の月次・年次点検を電気保安法人へ一括見積。',
  },
  {
    slug: 'elevator-hoshu',
    name: 'エレベーター保守点検',
    short: 'エレベーター保守',
    description: '建築基準法で義務付けられたエレベーターの定期点検・保守をPOG・フルメンテ契約で一括見積。',
  },
  {
    slug: 'johkasou',
    name: '浄化槽清掃・保守点検',
    short: '浄化槽清掃',
    description: '浄化槽法で義務付けられた年1回以上の清掃・定期保守点検を許可業者へ一括見積。',
  },
  {
    slug: 'haisuikan',
    name: '排水管高圧洗浄',
    short: '排水管洗浄',
    description: 'マンション・ビル・飲食店の排水管詰まり・悪臭を防ぐ高圧洗浄を実績業者へ一括見積。',
  },
  {
    slug: 'tokushu-kenchiku',
    name: '特殊建築物定期調査・定期検査報告',
    short: '特殊建築物調査',
    description: '建築基準法第12条で義務付けられた特殊建築物の定期調査報告を一級建築士・調査員へ一括見積。',
  },
  {
    slug: 'bouka-tenken',
    name: '防火対象物点検',
    short: '防火対象物点検',
    description: '消防法で義務付けられた防火対象物点検報告を防火対象物点検資格者へ一括見積。',
  },
  {
    slug: 'furon-tenken',
    name: 'フロン排出抑制法定期点検',
    short: 'フロン点検',
    description: 'フロン排出抑制法で義務付けられた業務用エアコン・冷凍冷蔵機器の定期点検を専門業者へ一括見積。',
  },
  {
    slug: 'reito-reizou',
    name: '業務用冷凍冷蔵設備メンテナンス',
    short: '冷凍冷蔵メンテ',
    description: '食品安全・商品廃棄リスクを防ぐ業務用冷凍冷蔵機器の定期点検・修理を冷凍機械責任者へ一括見積。',
  },
  {
    slug: 'solar-cleaning',
    name: '太陽光パネル清掃',
    short: 'パネル清掃',
    description: '汚れによる発電量低下を防ぐ太陽光パネルの専門清掃を純水洗浄・専用機材保有業者へ一括見積。',
  },
  {
    slug: 'solar-om',
    name: '太陽光発電所O&M（運用保守）',
    short: '太陽光O&M',
    description: 'FIT法対応・電気主任技術者選任義務を満たす太陽光発電所の運用保守を電気保安法人へ一括見積。',
  },
  {
    slug: 'gaiheki-toso',
    name: '外壁塗装・外壁修繕',
    short: '外壁塗装',
    description: '雨漏り・タイル落下リスクを防ぐ外壁塗装・修繕工事を施工実績豊富な業者へ一括見積。',
  },
  {
    slug: 'yane-fukikae',
    name: '屋根葺き替え・屋根修理',
    short: '屋根工事',
    description: '雨漏り・台風被害・経年劣化に対応する屋根葺き替え・カバー工法を建設業許可業者へ一括見積。',
  },
  {
    slug: 'kaitai',
    name: '建物解体工事',
    short: '建物解体',
    description: '建設リサイクル法・アスベスト事前調査・産廃マニフェスト対応の解体工事を許可業者へ一括見積。',
  },
  {
    slug: 'zanchibutsu',
    name: '残置物撤去・不用品回収（法人）',
    short: '残置物撤去',
    description: '退去物件・倉庫・工場の残置物撤去を一般廃棄物・産廃収集運搬業許可業者へ一括見積。',
  },
  {
    slug: 'bohan-camera',
    name: '防犯カメラ設置・防犯設備',
    short: '防犯カメラ',
    description: 'AI解析・遠隔監視・補助金活用に対応する防犯カメラ設置を専門業者へ一括見積。',
  },
  {
    slug: 'nyutaishitsu',
    name: '入退室管理システム導入',
    short: '入退室管理',
    description: 'カード・生体認証・クラウド管理に対応するセキュリティシステムの導入を専門業者へ一括見積。',
  },
  {
    slug: 'office-iten',
    name: 'オフィス移転・拠点移転',
    short: 'オフィス移転',
    description: '原状回復・内装工事・引越し・IT配線まで一括対応するオフィス移転を専門業者へ一括見積。',
  },
  {
    slug: 'chikudenchi',
    name: '蓄電池導入・産業用蓄電システム',
    short: '蓄電池導入',
    description: '補助金活用・自家消費最大化・停電対策に対応する蓄電池システムの導入を専門業者へ一括見積。',
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
