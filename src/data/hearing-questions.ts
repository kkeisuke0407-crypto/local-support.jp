// サービス別・事前ヒアリング質問定義
// hearing ページ（/hearing/）がサービスslugに応じて動的に描画する。
// 業者が「最低限の見積もりを出せる」粒度を、サービスごとに設計する。

export type HearingQuestionType = 'radio' | 'checkbox' | 'number' | 'text' | 'textarea';

export interface HearingQuestion {
  key: string;                 // 回答キー（英数字。サービス内で一意）
  label: string;               // 質問文
  type: HearingQuestionType;
  required?: boolean;
  options?: string[];          // radio / checkbox 用
  unit?: string;               // number 用の単位表示（㎡・kW・基 等）
  placeholder?: string;        // number / text / textarea 用
}

// サービスslug → 質問リスト
export const hearingQuestions: Record<string, HearingQuestion[]> = {
  // ── 害虫駆除（業務用PCO）───────────────────────────
  'pest-control': [
    { key: 'facility_type', label: '施設の種類は？', type: 'radio', required: true,
      options: ['飲食店', '食品工場・セントラルキッチン', 'ホテル・旅館', 'オフィスビル', '福祉・医療施設', '倉庫・物流施設', '店舗・小売', 'その他'] },
    { key: 'floor_area', label: '延床面積は？（概算で可）', type: 'number', required: true, unit: '㎡', placeholder: '例：500' },
    { key: 'floors', label: '建物は何階建てですか？', type: 'number', required: true, unit: '階', placeholder: '例：2' },
    { key: 'areas', label: '対象エリアは？（複数選択可）', type: 'checkbox', required: true,
      options: ['建物全体', '厨房・製造エリア', '客席・売場', '保管・倉庫', '事務所', '共用部', '建物外周・ゴミ置場'] },
    { key: 'target_pests', label: '対象の害虫は？（複数選択可）', type: 'checkbox', required: true,
      options: ['ゴキブリ', 'ネズミ', 'ハエ・コバエ', 'トコジラミ', 'その他', '不明・予防目的'] },
    { key: 'occurrence', label: '現在の発生状況は？', type: 'radio', required: true,
      options: ['発生していない（予防目的）', 'たまに見かける', '頻繁に見かける', '大量発生している'] },
    { key: 'frequency', label: 'ご希望の管理頻度は？', type: 'radio', required: true,
      options: ['月1回', '2か月に1回', '四半期に1回', 'スポット（単発）', '未定・業者提案を希望'] },
    { key: 'haccp', label: '衛生監査・HACCP対応（記録・報告書の発行）は必要ですか？', type: 'radio', required: true,
      options: ['必要', '不要', 'わからない'] },
    { key: 'work_time', label: '作業可能な時間帯は？', type: 'radio', required: true,
      options: ['営業・稼働中のみ', '閉店・停止後（夜間）', '休業日', 'いつでも可'] },
    { key: 'contract_status', label: '現在の契約状況は？（任意）', type: 'radio',
      options: ['新規導入', '既存業者あり（乗換検討）', '相見積もりを希望'] },
    { key: 'free_text', label: 'ご要望・現場の状況など（任意）', type: 'textarea',
      placeholder: '例：監査前で急ぎ／特定エリアで発生／夜しか入れない など（400字まで）' },
  ],

  // ── 受水槽清掃 ─────────────────────────────────
  'jusuisou-seisou': [
    { key: 'building_type', label: '建物の種類は？', type: 'radio', required: true,
      options: ['分譲マンション', '賃貸マンション・アパート', 'オフィスビル', '商業施設', 'ホテル・旅館', '工場・事業所', 'その他'] },
    { key: 'tank_capacity', label: '受水槽の有効容量は？（分かれば）', type: 'number', required: true, unit: '㎥', placeholder: '例：10' },
    { key: 'tank_count', label: '受水槽の基数は？', type: 'number', required: true, unit: '基', placeholder: '例：1' },
    { key: 'elevated_tank', label: '高置（高架）水槽はありますか？', type: 'radio', required: true,
      options: ['あり', 'なし', 'わからない'] },
    { key: 'scale', label: '規模（マンションは戸数／ビルは延床面積）', type: 'text', required: true, placeholder: '例：40戸 ／ 2,000㎡' },
    { key: 'water_test', label: '水質検査も希望しますか？', type: 'radio', required: true,
      options: ['希望する', '不要', 'わからない'] },
    { key: 'pump_pipe', label: 'ポンプ・配管の点検/交換も相談したいですか？（任意）', type: 'radio',
      options: ['相談したい', '不要', '不具合が出ている'] },
    { key: 'mgmt_status', label: '現在の管理状況は？', type: 'radio', required: true,
      options: ['新規（初めて依頼）', '既存業者あり（前回清掃済）', '前回時期が不明'] },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（1か月以内）', '2〜3か月以内', '時期は未定'] },
    { key: 'constraints', label: '作業上の制約（任意）', type: 'textarea',
      placeholder: '例：断水できる時間帯／仮設給水の要否／搬入経路が狭い など' },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea', placeholder: 'お気づきの点があればご記入ください（400字まで）' },
  ],

  // ── 太陽光パネル清掃 ───────────────────────────
  'solar-cleaning': [
    { key: 'install_type', label: '設置形態は？', type: 'radio', required: true,
      options: ['野立て（地上設置）', '屋根置き', 'カーポート', 'その他'] },
    { key: 'capacity_kw', label: '発電出力は？', type: 'number', required: true, unit: 'kW', placeholder: '例：83' },
    { key: 'panel_count', label: 'パネルの枚数は？', type: 'number', required: true, unit: '枚', placeholder: '例：186' },
    { key: 'site_condition', label: '立地の状況は？', type: 'radio', required: true,
      options: ['平地', '傾斜地', 'アクセスが悪い（道が狭い等）', 'わからない'] },
    { key: 'dirt_type', label: '汚れの状況は？（複数選択可）', type: 'checkbox', required: true,
      options: ['砂塵・黄砂', '鳥のフン', '苔・カビ', '落ち葉・樹液', 'わからない'] },
    { key: 'weeding', label: '除草作業も必要ですか？', type: 'radio', required: true,
      options: ['必要', '不要', '相談したい'] },
    { key: 'water_power', label: '現地に水道・電源はありますか？', type: 'radio', required: true,
      options: ['両方あり', '水道のみ', '電源のみ', 'どちらもなし', 'わからない'] },
    { key: 'frequency', label: 'ご希望の頻度は？', type: 'radio', required: true,
      options: ['年1回', '年2回', 'スポット（単発）', '未定・業者提案を希望'] },
    { key: 'mgmt_status', label: '現在の管理状況は？（任意）', type: 'radio',
      options: ['新規（初めて依頼）', 'O&M契約あり'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：発電量が落ちてきた／特定の時期に実施したい など（400字まで）' },
  ],

  // ── 自家用電気工作物点検（キュービクル点検）─────────
  // 保安管理業務の外部委託は「契約電力2,000kW未満・7,000V以下」が対象。
  // 見積は延床面積ではなく 契約電力(kW)・受電設備容量(kVA)・基数・点検頻度 で決まる。
  'jikayou-denki': [
    { key: 'facility_type', label: '施設の種類は？', type: 'radio', required: true,
      options: ['工場・倉庫', 'オフィスビル', '商業施設・店舗', 'マンション（共用部）', 'ホテル・旅館', '福祉・医療施設', '太陽光発電所', 'その他'] },
    { key: 'contract_power', label: '契約電力は？（検針票・電気料金明細に記載）', type: 'number', required: true, unit: 'kW', placeholder: '例：50' },
    { key: 'cubicle_capacity', label: '受電設備の容量は？（キュービクル銘板の kVA）', type: 'number', unit: 'kVA', placeholder: '例：75（不明な場合は空欄で可）' },
    { key: 'cubicle_count', label: 'キュービクルの基数は？', type: 'number', required: true, unit: '基', placeholder: '例：1' },
    { key: 'inspection_scope', label: 'ご希望の点検範囲は？', type: 'radio', required: true,
      options: ['月次点検＋年次点検（標準委託）', '隔月点検＋年次点検', '年次点検（停電作業）のみ', '未定・業者提案を希望'] },
    { key: 'remote_monitor', label: '絶縁監視装置（遠隔監視）は設置されていますか？', type: 'radio', required: true,
      options: ['設置済み', '未設置', '設置も相談したい', 'わからない'] },
    { key: 'contract_status', label: '現在の保安管理の状況は？', type: 'radio', required: true,
      options: ['新規（これから外部委託）', '既存の委託先あり（乗換検討）', '主任技術者を自社選任中', 'わからない'] },
    { key: 'annual_shutdown', label: '年次点検の停電（全停電）は可能ですか？', type: 'radio', required: true,
      options: ['可能（休日・夜間なら可を含む）', '不可（無停電での対応を希望）', 'わからない'] },
    { key: 'generator', label: '発電設備はありますか？（複数選択可）', type: 'checkbox',
      options: ['非常用発電機', '太陽光発電（連系）', '蓄電池', 'なし', 'わからない'] },
    { key: 'install_place', label: 'キュービクルの設置場所は？（任意）', type: 'radio',
      options: ['屋外（地上）', '屋上', '屋内（電気室）', 'わからない'] },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（1か月以内）', '2〜3か月以内', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：現在の委託費用／年次点検の希望時期／設備の不具合 など（400字まで）' },
  ],
};

// 未設定サービス用の汎用フォールバック（壊れた建物系フォームを出さないための最小構成）
export const defaultHearingQuestions: HearingQuestion[] = [
  { key: 'scale', label: '対象の規模（分かる範囲で）', type: 'textarea', required: true,
    placeholder: '例：延床◯㎡／台数◯台／数量◯ など、規模の目安をご記入ください' },
  { key: 'current_status', label: '現在の状況は？', type: 'radio', required: true,
    options: ['新規（初めて依頼）', '既存業者あり（乗換検討）', '不具合・トラブルが発生中', '情報収集中'] },
  { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
    options: ['急ぎ', '時期は未定'] },
  { key: 'constraints', label: '作業上の制約（任意）', type: 'textarea', placeholder: '例：稼働中のみ／夜間希望／アクセスが悪い など' },
  { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea', placeholder: 'お気づきの点をご記入ください（400字まで）' },
];
