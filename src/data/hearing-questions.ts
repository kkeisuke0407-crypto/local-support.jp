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

  // ── フロン排出抑制法 定期点検 ─────────────────────
  // 【設問の設計方針】運営は概算見積を出さない（CLAUDE.md §マッチング運用方針-2）。
  // したがってここで聞くのは「どの業者に声をかけるか」を決めるための情報だけに絞る。
  //
  // 聞かない：圧縮機の定格出力(kW)、50kW以上の有無、点検記録簿の整備状況。
  //   これらは点検義務の頻度（7.5kW未満=簡易点検のみ／7.5kW以上=3年に1回／
  //   50kW以上と冷凍冷蔵7.5kW以上=1年に1回）を分ける重要な変数だが、
  //   依頼者が銘板を見て答えるのは負担が大きく、業者が現地で判定すれば済む。
  //   依頼者に宿題を出すと着手が遅れるだけなので運営側では取得しない。
  // 聞く：機器の種別（空調か冷凍冷蔵かで対応できる業者が変わる）、
  //   台数と設置場所（作業条件）、希望範囲、状況、時期。
  'furon-tenken': [
    { key: 'facility_type', label: '施設の種類は？', type: 'radio', required: true,
      options: ['工場', '倉庫・物流施設', 'オフィスビル', '商業施設・店舗', '飲食店', 'ホテル・旅館', '福祉・医療施設', 'その他'] },
    { key: 'equipment_type', label: '対象機器の種類は？（複数選択可）', type: 'checkbox', required: true,
      options: ['業務用エアコン（パッケージ・ビル用マルチ等）', '冷凍・冷蔵機器（冷蔵庫・冷凍庫・ショーケース等）', 'チラー・冷凍機', 'その他・わからない'] },
    { key: 'unit_count_total', label: '対象機器はおおよそ何台ですか？', type: 'number', required: true, unit: '台', placeholder: '例：10（正確でなくて構いません）' },
    { key: 'install_place', label: '機器の設置場所は？（複数選択可）', type: 'checkbox', required: true,
      options: ['屋内（工場・倉庫内）', '屋上', '屋外（地上）', 'コンテナ・別棟', '高所（脚立や足場が必要）'] },
    { key: 'service_scope', label: 'ご希望の範囲は？', type: 'radio', required: true,
      options: ['定期点検のみ', '簡易点検＋定期点検の年間契約', '点検記録簿の作成・管理も委託したい', '未定・業者提案を希望'] },
    { key: 'contract_status', label: '現在の状況は？', type: 'radio', required: true,
      options: ['新規（初めて依頼）', '既存業者あり（乗換検討）', '漏えいや不具合が発生中', '情報収集中'] },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（1か月以内）', '2〜3か月以内', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：監督官庁からの指摘がある／機器の型番が分かる資料あり など（400字まで）' },
  ],

  // ── 看板・屋外広告物点検 ───────────────────────────
  // 【設問の設計方針】SOP §3.6 に同じ。見積の変数ではなく「どの業者に声をかけるか」を聞く。
  //
  // このサービス特有の足切り条件が2つある。
  //  ① 屋外広告業の登録業者でないと施工できない（都道府県・政令市・中核市ごとの登録制）
  //  ② 点検は屋外広告士・講習会修了者などの有資格者が行う必要がある
  // どちらも業者側の資格要件なので依頼者には聞かない。打診時に業者へ確認する。
  //
  // 依頼者に聞くのは、業者を絞り込む条件になるものだけ：
  //  ・看板の種類と高さ  → 高所作業車・足場の要否が変わり、対応できる業者が変わる
  //  ・電飾の有無        → 電気系の点検可否が変わる
  //  ・許可更新の期限    → 期限がある案件は納期が最優先の足切り条件になる
  // 寸法・面積・設置年は聞かない（依頼者が測りに行くことになるため。業者が現地で確認する）
  'signboard-inspection': [
    { key: 'signboard_type', label: '看板の種類は？（複数選択可）', type: 'checkbox', required: true,
      options: ['自立看板・ポール看板', '壁面看板', '袖看板・突き出し看板', '屋上看板', '野立て看板', 'その他・わからない'] },
    { key: 'signboard_count', label: '対象の看板はおおよそ何基ですか？', type: 'number', required: true, unit: '基', placeholder: '例：3（正確でなくて構いません）' },
    { key: 'signboard_height', label: 'いちばん高い看板の設置高さは？', type: 'radio', required: true,
      options: ['3m未満（脚立で届く）', '3〜5m程度', '5〜10m程度', '10m以上', 'わからない'] },
    { key: 'illumination', label: '電飾（内照式・照明付き）の看板はありますか？', type: 'radio', required: true,
      options: ['ある', 'ない', 'わからない'] },
    { key: 'inspection_purpose', label: '点検の目的は？', type: 'radio', required: true,
      options: ['許可更新前の点検（報告書が必要）', '定期的な安全点検', '劣化・破損が気になる', '未定・業者提案を希望'] },
    { key: 'permit_deadline', label: '許可更新の期限は決まっていますか？', type: 'radio', required: true,
      options: ['1か月以内', '2〜3か月以内', '半年以内', '期限は未定・更新ではない', 'わからない'] },
    { key: 'site_count', label: '対象の店舗・拠点はいくつありますか？', type: 'number', required: true, unit: '箇所', placeholder: '例：1' },
    { key: 'access', label: '作業上の制約はありますか？（複数選択可）', type: 'checkbox',
      options: ['歩道・道路にかかるため交通誘導が必要そう', '駐車スペースが狭い', '営業時間外でないと作業できない', '特になし・わからない'] },
    { key: 'contract_status', label: '現在の状況は？', type: 'radio', required: true,
      options: ['新規（初めて依頼）', '既存業者あり（乗換検討）', '破損・落下の懸念が発生中', '情報収集中'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：自治体から更新案内が届いている／看板の写真あり／設置業者が分からない など（400字まで）' },
  ],

  // ── エレベーター保守点検 ───────────────────────────
  // 【設問の設計方針】SOP §3.6 に同じ。見積の変数ではなく「どの業者に声をかけるか」を聞く。
  //
  // このサービスの足切り条件は2つ。
  //  ① エレベーターのメーカー・機種 → 独立系が対応できるかが機種で決まる
  //  ② 所在地から緊急出動できるか   → 閉じ込め時の到着時間。特に山間部・離島で効く
  // 保守会社は「メーカー系（三菱・日立・東芝・オーチス・フジテック等の系列）」と
  // 「独立系（系列に属さない専業）」に分かれ、独立系のほうが安いのが一般的。
  // ただし機種によっては独立系が保守できないため、メーカーは必ず聞く。
  //
  // 契約形態は POG（消耗品のみ・部品交換は別途）と フルメンテナンス（部品交換込み）。
  // 費用が数倍変わるため希望を聞くが、決められない場合は業者提案に委ねてよい。
  'elevator-hoshu': [
    { key: 'building_type', label: '建物の種類は？', type: 'radio', required: true,
      options: ['分譲マンション', '賃貸マンション・アパート', 'オフィスビル', '商業施設・店舗', 'ホテル・旅館', '福祉・医療施設', '工場・倉庫', 'その他'] },
    { key: 'maker', label: 'エレベーターのメーカーは？（かご内の銘板に記載）', type: 'radio', required: true,
      options: ['三菱電機', '日立', '東芝', 'オーチス', 'フジテック', 'シンドラー', 'その他', 'わからない'] },
    { key: 'unit_count', label: '対象のエレベーターは何機ですか？', type: 'number', required: true, unit: '機', placeholder: '例：1' },
    { key: 'floors', label: '停止階数は？', type: 'number', required: true, unit: '階', placeholder: '例：2' },
    { key: 'elevator_type', label: 'エレベーターの種類は？', type: 'radio', required: true,
      options: ['乗用（人が乗る）', '寝台用・ストレッチャー対応', '荷物用・小荷物専用', 'その他・わからない'] },
    { key: 'contract_type', label: 'ご希望の契約形態は？', type: 'radio', required: true,
      options: ['POG契約（消耗品のみ・部品交換は別途）', 'フルメンテナンス契約（部品交換込み）', '未定・業者提案を希望', 'わからない'] },
    { key: 'contract_status', label: '現在の状況は？', type: 'radio', required: true,
      options: ['新規（初めて依頼）', '既存業者あり（乗換検討）', '不具合・停止が発生している', '情報収集中'] },
    { key: 'current_maintainer', label: '現在の保守会社は？（乗換検討の場合・任意）', type: 'radio',
      options: ['メーカー系（メーカーの系列会社）', '独立系（系列に属さない専業）', 'わからない', '該当なし'] },
    { key: 'emergency', label: '緊急対応で重視する点は？（複数選択可）', type: 'checkbox',
      options: ['閉じ込め時の駆けつけの速さ', '24時間365日の受付', '遠隔監視の有無', '高齢者・車椅子利用者への配慮', '特にこだわりはない'] },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（1か月以内）', '2〜3か月以内', '現契約の更新時期に合わせたい', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：現在の年間保守料／設置年／過去の不具合／現契約の解約時期 など（400字まで）' },
  ],
  // ── 業務用エアコン洗浄・修理 ─────────────────────
  // 機種と設置場所で必要な機材（高所作業・養生）が変わり、対応できる業者が分かれる。
  'aircon-business': [
    { key: 'facility_type', label: '施設の種類は？', type: 'radio', required: true,
      options: ['飲食店', '店舗・小売', 'オフィスビル', '工場・倉庫', 'ホテル・旅館', '福祉・医療施設', 'その他'] },
    { key: 'work_scope', label: 'ご依頼の作業区分は？', type: 'radio', required: true,
      options: ['分解洗浄（クリーニング）', '故障の修理', '定期メンテナンス契約', '入れ替え・更新の相談', '未定・業者提案を希望'] },
    { key: 'unit_type', label: 'エアコンの種類は？（複数選択可）', type: 'checkbox', required: true,
      options: ['天井カセット型', '天井吊り型', '壁掛け型', '床置き型', 'ビル用マルチ', 'その他・わからない'] },
    { key: 'unit_count', label: '対象は何台ですか？', type: 'number', required: true, unit: '台', placeholder: '例：6（概算で可）' },
    { key: 'install_height', label: '設置場所の高さは？', type: 'radio', required: true,
      options: ['脚立で届く（3m未満）', '3〜5m程度', '5m以上・高所作業が必要', 'わからない'] },
    { key: 'work_time', label: '作業可能な時間帯は？', type: 'radio', required: true,
      options: ['営業・稼働中のみ', '閉店・停止後（夜間）', '休業日', 'いつでも可'] },
    { key: 'contract_status', label: '現在の状況は？', type: 'radio', required: true,
      options: ['新規（初めて依頼）', '既存業者あり（乗換検討）', '故障・不具合が発生中', '情報収集中'] },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（1か月以内）', '2〜3か月以内', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：特定の1台だけ効きが悪い／繁忙期前に済ませたい など（400字まで）' },
  ],

  // ── アスベスト調査・除去 ───────────────────────────
  // 2022年4月から一定規模以上の解体・改修で事前調査結果の報告が義務化。
  // 調査は「建築物石綿含有建材調査者」等の有資格者が行う必要がある。
  // レベル1〜3（発じん性の区分）で必要な資格・届出・工法が変わるが、
  // 依頼者が判定できるものではないため「わからない」を必ず用意する。
  'asbestos': [
    { key: 'building_type', label: '建物の種類は？', type: 'radio', required: true,
      options: ['オフィスビル', '商業施設・店舗', 'マンション・アパート', '工場・倉庫', '学校・公共施設', '福祉・医療施設', 'その他'] },
    { key: 'request_type', label: 'ご相談内容は？', type: 'radio', required: true,
      options: ['事前調査（書面・現地調査）', '分析（検体の定性・定量）', '除去・封じ込め工事', '調査から除去まで一括', '未定・業者提案を希望'] },
    { key: 'build_year', label: '建物の建築時期は？', type: 'radio', required: true,
      options: ['2006年9月以降', '1996年〜2006年8月', '1995年以前', 'わからない'] },
    { key: 'floor_area', label: '延床面積は？（概算で可）', type: 'number', required: true, unit: '㎡', placeholder: '例：500' },
    { key: 'purpose', label: '調査・工事のきっかけは？', type: 'radio', required: true,
      options: ['解体工事の予定がある', '改修・リフォームの予定がある', '売買・賃貸の前に確認したい', '行政から指摘を受けた', '定期的な確認・情報収集'] },
    { key: 'deadline', label: '期限はありますか？', type: 'radio', required: true,
      options: ['1か月以内', '2〜3か月以内', '半年以内', '期限は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：過去の調査報告書がある／設計図書が残っている／対象箇所が限定されている など（400字まで）' },
  ],

  // ── 防犯カメラ設置・防犯設備 ───────────────────────
  'bohan-camera': [
    { key: 'facility_type', label: '設置場所の種類は？', type: 'radio', required: true,
      options: ['店舗・小売', '飲食店', 'オフィスビル', '工場・倉庫', 'マンション（共用部）', '駐車場・屋外施設', '福祉・医療施設', 'その他'] },
    { key: 'camera_count', label: 'ご希望の台数は？', type: 'radio', required: true,
      options: ['1〜4台', '5〜9台', '10〜19台', '20台以上', '未定・業者提案を希望'] },
    { key: 'install_place', label: '設置場所は？（複数選択可）', type: 'checkbox', required: true,
      options: ['屋内', '屋外', '高所（脚立では届かない）', '駐車場・敷地内', 'わからない'] },
    { key: 'existing', label: '既存の防犯カメラはありますか？', type: 'radio', required: true,
      options: ['なし（新規導入）', 'あり（増設したい）', 'あり（入れ替えたい）', 'わからない'] },
    { key: 'recording', label: '録画・確認の方法でご希望は？（複数選択可）', type: 'checkbox',
      options: ['スマホ・PCから遠隔で見たい', '長期間の保存が必要', '夜間もはっきり映したい', '特にこだわりはない'] },
    { key: 'site_count', label: '対象の拠点はいくつありますか？', type: 'number', required: true, unit: '箇所', placeholder: '例：1' },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（1か月以内）', '2〜3か月以内', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：盗難があり急いでいる／配線を露出させたくない／既存の配線を使いたい など（400字まで）' },
  ],

  // ── 防火対象物点検 ─────────────────────────────
  // 消防法第8条の2の2。特定防火対象物で収容人員300人以上等が対象。
  // 点検は「防火対象物点検資格者」が行い、年1回の報告義務がある。
  'bouka-tenken': [
    { key: 'building_use', label: '建物の用途は？', type: 'radio', required: true,
      options: ['飲食店', '物販店舗', 'ホテル・旅館', '福祉・医療施設', '事務所', '複合用途ビル', 'その他'] },
    { key: 'inspection_type', label: 'ご依頼の点検区分は？', type: 'radio', required: true,
      options: ['防火対象物点検', '防災管理点検', '両方', 'わからない・業者判断を希望'] },
    { key: 'capacity', label: '収容人員はおおよそ何名ですか？', type: 'radio', required: true,
      options: ['30人未満', '30〜299人', '300人以上', 'わからない'] },
    { key: 'floor_area', label: '延床面積は？（概算で可）', type: 'number', required: true, unit: '㎡', placeholder: '例：1500' },
    { key: 'floors', label: '階数は？（地上）', type: 'number', required: true, unit: '階', placeholder: '例：5' },
    { key: 'deadline', label: '報告の期限はありますか？', type: 'radio', required: true,
      options: ['1か月以内', '2〜3か月以内', '半年以内', '期限は未定・わからない'] },
    { key: 'contract_status', label: '現在の状況は？', type: 'radio', required: true,
      options: ['新規（初めて依頼）', '既存業者あり（乗換検討）', '消防から指摘を受けた', '情報収集中'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：消防設備点検とまとめて依頼したい／テナントが複数入っている など（400字まで）' },
  ],

  // ── 蓄電池導入・産業用蓄電システム ─────────────────
  'chikudenchi': [
    { key: 'facility_type', label: '導入先の種類は？', type: 'radio', required: true,
      options: ['工場', '倉庫・物流施設', 'オフィスビル', '商業施設・店舗', '福祉・医療施設', '公共施設', 'その他'] },
    { key: 'purpose', label: '導入の目的は？（複数選択可）', type: 'checkbox', required: true,
      options: ['停電対策・BCP', '電気代の削減（ピークカット）', '太陽光の自家消費率を上げたい', '再エネ比率の向上・脱炭素', '未定・業者提案を希望'] },
    { key: 'contract_power', label: '契約電力は？（検針票に記載）', type: 'number', unit: 'kW', placeholder: '例：50（不明なら空欄で可）' },
    { key: 'solar_existing', label: '太陽光発電の設置状況は？', type: 'radio', required: true,
      options: ['設置済み', '未設置（同時に検討したい）', '未設置（蓄電池のみ）', 'わからない'] },
    { key: 'install_place', label: '設置スペースの想定は？', type: 'radio', required: true,
      options: ['屋外（地上）', '屋内', '屋上', '未定・現地で相談したい'] },
    { key: 'subsidy', label: '補助金の活用をご希望ですか？', type: 'radio', required: true,
      options: ['活用したい', '不要', 'わからない・相談したい'] },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（3か月以内）', '半年以内', '次年度予算で検討', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：特定の設備だけ非常時に動かしたい／過去に停電で被害が出た など（400字まで）' },
  ],

  // ── ダクト清掃 ─────────────────────────────────
  // 厨房排気ダクトは火災予防条例で定期清掃が求められる自治体が多い。
  // 空調ダクト・排煙ダクトとは必要な機材と資格が異なるため種別は必ず聞く。
  'duct': [
    { key: 'duct_type', label: 'ダクトの種別は？（複数選択可）', type: 'checkbox', required: true,
      options: ['厨房排気ダクト（グリスフィルター含む）', '空調ダクト', '排煙ダクト', 'その他・わからない'] },
    { key: 'facility_type', label: '施設の種類は？', type: 'radio', required: true,
      options: ['飲食店', 'ホテル・旅館', '食品工場・セントラルキッチン', '商業施設', 'オフィスビル', '福祉・医療施設', 'その他'] },
    { key: 'floor_area', label: '延床面積は？（概算で可）', type: 'number', required: true, unit: '㎡', placeholder: '例：200' },
    { key: 'duct_route', label: 'ダクトの経路について、分かる範囲で', type: 'radio', required: true,
      options: ['屋上まで縦に伸びている', '壁を抜けて屋外へ出ている', '天井裏を横に走っている', 'わからない'] },
    { key: 'work_time', label: '作業可能な時間帯は？', type: 'radio', required: true,
      options: ['営業・稼働中のみ', '閉店・停止後（夜間）', '休業日', 'いつでも可'] },
    { key: 'last_cleaning', label: '前回の清掃時期は？', type: 'radio', required: true,
      options: ['1年以内', '1〜3年前', '3年以上前', '実施したことがない・わからない'] },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（1か月以内）', '2〜3か月以内', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：消防の立入検査で指摘された／油の臭いが気になる など（400字まで）' },
  ],

  // ── 外壁塗装・外壁修繕 ─────────────────────────
  'gaiheki-toso': [
    { key: 'building_type', label: '建物の種類は？', type: 'radio', required: true,
      options: ['分譲マンション', '賃貸マンション・アパート', 'オフィスビル', '商業施設・店舗', '工場・倉庫', '福祉・医療施設', 'その他'] },
    { key: 'floors', label: '階数は？', type: 'number', required: true, unit: '階', placeholder: '例：4' },
    { key: 'floor_area', label: '延床面積は？（概算で可）', type: 'number', required: true, unit: '㎡', placeholder: '例：1200' },
    { key: 'wall_material', label: '外壁の種類は？', type: 'radio', required: true,
      options: ['コンクリート・モルタル', 'サイディング', 'ALCパネル', 'タイル', 'その他・わからない'] },
    { key: 'condition', label: '現在の状態は？（複数選択可）', type: 'checkbox', required: true,
      options: ['ひび割れがある', '塗装の色あせ・チョーキング', '雨漏りしている', 'タイルの浮き・剥落', '特に不具合はない（予防・定期）', 'わからない'] },
    { key: 'scaffold', label: '足場を組むスペースはありますか？', type: 'radio', required: true,
      options: ['ある', '一部狭い箇所がある', 'ない・隣地が近い', 'わからない'] },
    { key: 'work_scope', label: 'ご依頼の範囲は？', type: 'radio', required: true,
      options: ['外壁塗装のみ', '外壁＋屋根', '防水工事も含む', '大規模修繕として一括', '未定・業者提案を希望'] },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（3か月以内）', '半年以内', '次年度予算で検討', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：修繕積立金の範囲で検討したい／入居者への配慮が必要 など（400字まで）' },
  ],

  // ── グリストラップ清掃 ─────────────────────────
  // 汲み取った汚泥は産業廃棄物。収集運搬の許可を持つ業者でないと処分まで請け負えない。
  'grease-trap': [
    { key: 'facility_type', label: '施設の種類は？', type: 'radio', required: true,
      options: ['飲食店', '食品工場・セントラルキッチン', 'ホテル・旅館', '商業施設（フードコート等）', '福祉・医療施設の厨房', '社員食堂', 'その他'] },
    { key: 'trap_size', label: 'グリストラップの大きさの目安は？', type: 'radio', required: true,
      options: ['小型（幅60cm程度まで）', '中型（幅1m前後）', '大型（幅1.5m以上）', '複数ある', 'わからない'] },
    { key: 'trap_count', label: '対象は何基ですか？', type: 'number', required: true, unit: '基', placeholder: '例：1' },
    { key: 'frequency', label: 'ご希望の清掃頻度は？', type: 'radio', required: true,
      options: ['月1回', '2か月に1回', '四半期に1回', 'スポット（単発）', '未定・業者提案を希望'] },
    { key: 'waste_disposal', label: '汚泥の処分もご依頼されますか？', type: 'radio', required: true,
      options: ['処分まで依頼したい', '清掃のみでよい', 'わからない・相談したい'] },
    { key: 'work_time', label: '作業可能な時間帯は？', type: 'radio', required: true,
      options: ['営業・稼働中のみ', '閉店後（夜間）', '開店前（早朝）', '休業日', 'いつでも可'] },
    { key: 'contract_status', label: '現在の状況は？', type: 'radio', required: true,
      options: ['新規（初めて依頼）', '既存業者あり（乗換検討）', '臭い・詰まりが発生中', '情報収集中'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：保健所の指導が入った／マニフェストの発行が必要 など（400字まで）' },
  ],

  // ── 排水管高圧洗浄 ─────────────────────────────
  'haisuikan': [
    { key: 'building_type', label: '建物の種類は？', type: 'radio', required: true,
      options: ['分譲マンション', '賃貸マンション・アパート', 'オフィスビル', '商業施設・店舗', '飲食店', '工場・倉庫', 'その他'] },
    { key: 'scope', label: 'ご依頼の対象範囲は？', type: 'radio', required: true,
      options: ['専有部（各室内）', '共用部（縦管・横引管）', '専有部＋共用部', '厨房系統のみ', '未定・業者提案を希望'] },
    { key: 'unit_count', label: '対象の戸数・室数は？', type: 'number', required: true, unit: '戸', placeholder: '例：40（概算で可）' },
    { key: 'floors', label: '階数は？', type: 'number', required: true, unit: '階', placeholder: '例：5' },
    { key: 'last_cleaning', label: '前回の実施時期は？', type: 'radio', required: true,
      options: ['1年以内', '1〜3年前', '3年以上前', '実施したことがない・わからない'] },
    { key: 'trouble', label: '現在、詰まりや排水不良はありますか？', type: 'radio', required: true,
      options: ['発生している', '一部で気になる', 'ない（定期・予防）', 'わからない'] },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（1か月以内）', '2〜3か月以内', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：入居者への告知が必要／駐車スペースが限られる など（400字まで）' },
  ],

  // ── 浄化槽清掃・保守点検 ───────────────────────
  // 浄化槽法：保守点検・清掃（年1回以上）・法定検査（第11条検査）の3つが義務。
  // 清掃は「浄化槽清掃業」の市町村長許可、保守点検は都道府県の登録が必要で、
  // 業務範囲によって必要な許可が異なる。
  'johkasou': [
    { key: 'facility_type', label: '設置先の種類は？', type: 'radio', required: true,
      options: ['店舗・事業所', '工場', '福祉・医療施設', '学校・公共施設', '集合住宅', '戸建て', 'その他'] },
    { key: 'capacity', label: '浄化槽の人槽は？', type: 'radio', required: true,
      options: ['5〜10人槽', '11〜50人槽', '51〜100人槽', '101人槽以上', 'わからない'] },
    { key: 'work_scope', label: 'ご依頼の業務範囲は？（複数選択可）', type: 'checkbox', required: true,
      options: ['保守点検', '清掃（汚泥の引き抜き）', '法定検査の手配', '3つすべて一括', '未定・業者提案を希望'] },
    { key: 'tank_type', label: '浄化槽の種類は？', type: 'radio', required: true,
      options: ['合併処理浄化槽', '単独処理浄化槽（みなし浄化槽）', 'わからない'] },
    { key: 'contract_status', label: '現在の状況は？', type: 'radio', required: true,
      options: ['新規（初めて依頼）', '既存業者あり（乗換検討）', '臭い・異常が発生中', '行政から指導を受けた', '情報収集中'] },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（1か月以内）', '2〜3か月以内', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：下水道への接続を検討している／ブロワーの音が気になる など（400字まで）' },
  ],

  // ── 建物解体工事 ───────────────────────────────
  // 構造（木造/S造/RC造）で必要な重機と許可が変わる。
  // 2022年4月からアスベストの事前調査結果の報告が義務化されており、解体では必須。
  'kaitai': [
    { key: 'building_type', label: '建物の種類は？', type: 'radio', required: true,
      options: ['店舗・事務所', '工場・倉庫', 'アパート・マンション', '戸建て住宅', '倉庫・車庫のみ', 'その他'] },
    { key: 'structure', label: '建物の構造は？', type: 'radio', required: true,
      options: ['木造', '鉄骨造（S造）', '鉄筋コンクリート造（RC造）', '混構造', 'わからない'] },
    { key: 'floor_area', label: '延床面積は？（概算で可）', type: 'number', required: true, unit: '㎡', placeholder: '例：150' },
    { key: 'floors', label: '階数は？', type: 'number', required: true, unit: '階', placeholder: '例：2' },
    { key: 'build_year', label: '建築時期は？（アスベスト調査の要否に関わります）', type: 'radio', required: true,
      options: ['2006年9月以降', '1995年以前', '1996年〜2006年8月', 'わからない'] },
    { key: 'leftovers', label: '残置物（家具・什器など）はありますか？', type: 'radio', required: true,
      options: ['ない（空の状態）', '少しある', '多く残っている', 'わからない'] },
    { key: 'access', label: '前面道路と搬出経路の状況は？', type: 'radio', required: true,
      options: ['大型車が入れる', '小型車なら入れる', '狭くて重機の搬入が難しそう', 'わからない'] },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（1か月以内）', '2〜3か月以内', '半年以内', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：売却が決まっている／隣家が近い／滅失登記まで依頼したい など（400字まで）' },
  ],

  // ── 入退室管理システム導入 ─────────────────────
  'nyutaishitsu': [
    { key: 'facility_type', label: '導入先の種類は？', type: 'radio', required: true,
      options: ['オフィス', '工場', '倉庫・物流施設', '研究施設・データセンター', '福祉・医療施設', '学校・公共施設', 'その他'] },
    { key: 'door_count', label: '対象の扉は何箇所ですか？', type: 'number', required: true, unit: '箇所', placeholder: '例：3' },
    { key: 'auth_type', label: 'ご希望の認証方式は？（複数選択可）', type: 'checkbox', required: true,
      options: ['ICカード・社員証', 'スマートフォン', '暗証番号（テンキー）', '生体認証（顔・指紋）', '未定・業者提案を希望'] },
    { key: 'existing', label: '既存の設備はありますか？', type: 'radio', required: true,
      options: ['なし（新規導入）', 'あり（増設したい）', 'あり（入れ替えたい）', 'わからない'] },
    { key: 'integration', label: '他システムとの連携のご希望は？（複数選択可）', type: 'checkbox',
      options: ['勤怠管理と連携したい', '防犯カメラと連携したい', '入退室の履歴を残したい', '特にこだわりはない'] },
    { key: 'site_count', label: '対象の拠点はいくつありますか？', type: 'number', required: true, unit: '箇所', placeholder: '例：1' },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（1か月以内）', '2〜3か月以内', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：ISMS取得のため必要／退職者のカード回収に困っている など（400字まで）' },
  ],

  // ── オフィス移転・拠点移転 ─────────────────────
  'office-iten': [
    { key: 'move_type', label: 'ご依頼の業務範囲は？（複数選択可）', type: 'checkbox', required: true,
      options: ['荷物の運搬・移設', '什器・OA機器の設置', 'ネットワーク・電話の移設', '不用品の処分', '原状回復工事', '内装工事', '未定・業者提案を希望'] },
    { key: 'headcount', label: '移転する人数は？', type: 'number', required: true, unit: '名', placeholder: '例：30' },
    { key: 'area_from', label: '移転元の広さは？（概算で可）', type: 'number', required: true, unit: '坪', placeholder: '例：50' },
    { key: 'floors_access', label: '搬出入の条件で当てはまるものは？（複数選択可）', type: 'checkbox',
      options: ['エレベーターが使える', '搬入用エレベーターがない階がある', 'トラックの駐車スペースが限られる', '養生の指定がある', 'わからない'] },
    { key: 'move_date', label: '移転予定日は決まっていますか？', type: 'radio', required: true,
      options: ['決まっている（1か月以内）', '決まっている（2〜3か月先）', '概ね決まっている（半年以内）', '未定'] },
    { key: 'weekend', label: '作業日のご希望は？', type: 'radio', required: true,
      options: ['土日・祝日', '平日夜間', '平日日中でも可', '未定・業者提案を希望'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：サーバーの移設がある／金庫がある／移転先が未確定 など（400字まで）' },
  ],

  // ── 業務用冷凍冷蔵設備メンテナンス ─────────────────
  'reito-reizou': [
    { key: 'facility_type', label: '施設の種類は？', type: 'radio', required: true,
      options: ['飲食店', 'スーパー・小売', '食品工場', '倉庫・物流施設（冷凍冷蔵倉庫）', 'ホテル・旅館', '福祉・医療施設', 'その他'] },
    { key: 'equipment_type', label: '対象機器は？（複数選択可）', type: 'checkbox', required: true,
      options: ['業務用冷蔵庫・冷凍庫', 'ショーケース', 'プレハブ冷蔵庫・冷凍庫', '製氷機', 'チラー・冷凍機', 'その他・わからない'] },
    { key: 'unit_count', label: '対象は何台ですか？', type: 'number', required: true, unit: '台', placeholder: '例：5（概算で可）' },
    { key: 'work_scope', label: 'ご依頼の業務範囲は？', type: 'radio', required: true,
      options: ['定期メンテナンス契約', '故障の修理', '洗浄・清掃', '入れ替え・更新の相談', '未定・業者提案を希望'] },
    { key: 'emergency', label: '緊急時の対応でご希望は？', type: 'radio', required: true,
      options: ['24時間365日の対応が必要', '営業時間内の対応で十分', '未定・業者提案を希望'] },
    { key: 'contract_status', label: '現在の状況は？', type: 'radio', required: true,
      options: ['新規（初めて依頼）', '既存業者あり（乗換検討）', '故障・不具合が発生中', '情報収集中'] },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（1か月以内）', '2〜3か月以内', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：食材のロスが出ており急いでいる／温度記録も残したい など（400字まで）' },
  ],

  // ── 消防設備点検 ───────────────────────────────
  // 消防法第17条の3の3。機器点検は6か月ごと、総合点検は1年ごと。
  // 報告は特定防火対象物が年1回、非特定が3年に1回。
  'shobo-setsubi': [
    { key: 'building_use', label: '建物の用途は？', type: 'radio', required: true,
      options: ['飲食店', '物販店舗', 'ホテル・旅館', '福祉・医療施設', '事務所', '工場・倉庫', '共同住宅', '複合用途ビル', 'その他'] },
    { key: 'floor_area', label: '延床面積は？（概算で可）', type: 'number', required: true, unit: '㎡', placeholder: '例：800' },
    { key: 'floors', label: '階数は？（地上）', type: 'number', required: true, unit: '階', placeholder: '例：4' },
    { key: 'equipment', label: '設置されている消防設備は？（複数選択可）', type: 'checkbox', required: true,
      options: ['消火器', '自動火災報知設備', 'スプリンクラー設備', '屋内消火栓', '誘導灯', '避難器具', '排煙設備', 'わからない'] },
    { key: 'inspection_type', label: 'ご依頼の点検区分は？', type: 'radio', required: true,
      options: ['機器点検（6か月ごと）', '総合点検（1年ごと）', '両方・年間契約', '未定・業者提案を希望'] },
    { key: 'deadline', label: '報告の期限はありますか？', type: 'radio', required: true,
      options: ['1か月以内', '2〜3か月以内', '半年以内', '期限は未定・わからない'] },
    { key: 'contract_status', label: '現在の状況は？', type: 'radio', required: true,
      options: ['新規（初めて依頼）', '既存業者あり（乗換検討）', '消防から指摘を受けた', '情報収集中'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：複数棟をまとめて依頼したい／不良箇所の改修も相談したい など（400字まで）' },
  ],

  // ── シャッター点検・修理 ───────────────────────
  // 防火シャッターは建築基準法12条の定期検査（防火設備）の対象。
  // 軽量・重量・防火で必要な資格と部材が変わるため種別は必ず聞く。
  'shutter': [
    { key: 'shutter_type', label: 'シャッターの種類は？（複数選択可）', type: 'checkbox', required: true,
      options: ['軽量シャッター（店舗の出入口等）', '重量シャッター（工場・倉庫）', '防火シャッター', 'グリルシャッター', 'その他・わからない'] },
    { key: 'request_type', label: 'ご相談内容は？', type: 'radio', required: true,
      options: ['定期点検', '故障の修理', '交換・更新', '電動化の相談', '未定・業者提案を希望'] },
    { key: 'shutter_count', label: '対象は何台ですか？', type: 'number', required: true, unit: '台', placeholder: '例：2' },
    { key: 'operation', label: '操作方式は？', type: 'radio', required: true,
      options: ['電動', '手動', '両方ある', 'わからない'] },
    { key: 'trouble', label: '現在の状態は？（複数選択可）', type: 'checkbox',
      options: ['開閉が重い・動かない', '異音がする', '途中で止まる', '見た目の劣化・サビ', '特に不具合はない（定期点検）'] },
    { key: 'facility_type', label: '設置先の種類は？', type: 'radio', required: true,
      options: ['店舗・小売', '工場・倉庫', 'オフィスビル', '商業施設', '駐車場', 'その他'] },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（1か月以内）', '2〜3か月以内', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：閉まらず戸締まりできない／防火設備の定期検査で指摘された など（400字まで）' },
  ],

  // ── 太陽光発電所O&M（運用保守）─────────────────
  // 50kW以上の高圧は電気主任技術者の選任・外部委託が必要で、対応できる業者が限られる。
  'solar-om': [
    { key: 'capacity_kw', label: '発電出力は？', type: 'number', required: true, unit: 'kW', placeholder: '例：250' },
    { key: 'voltage_class', label: '連系区分は？', type: 'radio', required: true,
      options: ['低圧（50kW未満）', '高圧（50kW以上）', '特別高圧', 'わからない'] },
    { key: 'install_type', label: '設置形態は？', type: 'radio', required: true,
      options: ['野立て（地上設置）', '屋根置き', '営農型（ソーラーシェアリング）', 'その他'] },
    { key: 'work_scope', label: 'ご依頼の業務範囲は？（複数選択可）', type: 'checkbox', required: true,
      options: ['定期点検', '電気主任技術者の外部委託', '除草', 'パネル洗浄', '遠隔監視', '故障対応・修繕', '未定・業者提案を希望'] },
    { key: 'monitoring', label: '遠隔監視システムの状況は？', type: 'radio', required: true,
      options: ['設置済みで稼働中', '設置済みだが活用できていない', '未設置', 'わからない'] },
    { key: 'site_count', label: '対象の発電所はいくつありますか？', type: 'number', required: true, unit: '箇所', placeholder: '例：1' },
    { key: 'contract_status', label: '現在の状況は？', type: 'radio', required: true,
      options: ['新規（初めて依頼）', '既存業者あり（乗換検討）', '発電量の低下が気になる', '故障・停止が発生中', '情報収集中'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：発電量が想定を下回っている／FIT期間の残りが少ない など（400字まで）' },
  ],

  // ── 特殊建築物定期調査・定期検査報告 ─────────────
  // 建築基準法第12条。特定行政庁が定める用途・規模の建築物が対象で、
  // 「建築物」「建築設備」「防火設備」「昇降機」の4区分がある。
  // 調査者は一級建築士・二級建築士または各調査資格者に限られる。
  'tokushu-kenchiku': [
    { key: 'building_use', label: '建物の用途は？', type: 'radio', required: true,
      options: ['ホテル・旅館', '物販店舗', '飲食店', '福祉・医療施設', '共同住宅', '学校', '事務所', '複合用途', 'その他'] },
    { key: 'report_type', label: 'ご依頼の報告区分は？（複数選択可）', type: 'checkbox', required: true,
      options: ['特定建築物（建築物）調査', '建築設備検査', '防火設備検査', '昇降機等検査', 'わからない・業者判断を希望'] },
    { key: 'floor_area', label: '延床面積は？（概算で可）', type: 'number', required: true, unit: '㎡', placeholder: '例：3000' },
    { key: 'floors', label: '階数は？（地上）', type: 'number', required: true, unit: '階', placeholder: '例：6' },
    { key: 'deadline', label: '報告の期限はありますか？', type: 'radio', required: true,
      options: ['1か月以内', '2〜3か月以内', '半年以内', '期限は未定・わからない'] },
    { key: 'contract_status', label: '現在の状況は？', type: 'radio', required: true,
      options: ['新規（初めて依頼）', '既存業者あり（乗換検討）', '特定行政庁から通知が届いた', '情報収集中'] },
    { key: 'building_count', label: '対象の建物はいくつありますか？', type: 'number', required: true, unit: '棟', placeholder: '例：1' },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：前回の報告書がある／是正指摘の改修も相談したい など（400字まで）' },
  ],

  // ── 屋根葺き替え・屋根修理 ─────────────────────
  'yane-fukikae': [
    { key: 'building_type', label: '建物の種類は？', type: 'radio', required: true,
      options: ['工場・倉庫', '店舗・事務所', 'アパート・マンション', '戸建て住宅', '福祉・医療施設', 'その他'] },
    { key: 'roof_material', label: '屋根の種類は？', type: 'radio', required: true,
      options: ['折板・金属屋根', 'スレート（コロニアル）', '瓦', '陸屋根（防水）', 'その他・わからない'] },
    { key: 'roof_area', label: '屋根の面積は？（概算で可）', type: 'number', required: true, unit: '㎡', placeholder: '例：300（不明なら延床面積で可）' },
    { key: 'floors', label: '階数は？', type: 'number', required: true, unit: '階', placeholder: '例：2' },
    { key: 'work_method', label: 'ご希望の工事方法は？', type: 'radio', required: true,
      options: ['葺き替え（撤去して新設）', 'カバー工法（重ね葺き）', '部分補修', '塗装', '未定・業者提案を希望'] },
    { key: 'leak', label: '雨漏りは発生していますか？', type: 'radio', required: true,
      options: ['発生している', '過去に発生した', 'していない（予防・定期）', 'わからない'] },
    { key: 'asbestos_risk', label: '建築時期は？（スレートのアスベスト調査に関わります）', type: 'radio', required: true,
      options: ['2006年9月以降', '2006年8月以前', 'わからない'] },
    { key: 'timing', label: 'ご希望の時期は？', type: 'radio', required: true,
      options: ['急ぎ（1か月以内）', '2〜3か月以内', '半年以内', '時期は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：台風で破損した／稼働を止められない／火災保険の申請も検討 など（400字まで）' },
  ],

  // ── 残置物撤去・不用品回収（法人）───────────────
  // 事業所から出るものは産業廃棄物。収集運搬の許可を持つ業者でないと運べない。
  'zanchibutsu': [
    { key: 'property_type', label: '対象の物件は？', type: 'radio', required: true,
      options: ['店舗・事務所', '工場・倉庫', 'アパート・マンション（1室）', 'アパート・マンション（一棟）', '戸建て', 'その他'] },
    { key: 'volume', label: '量の目安は？', type: 'radio', required: true,
      options: ['軽トラック1台程度', '2トントラック1台程度', '2トントラック2〜3台程度', '4トントラック以上', 'わからない'] },
    { key: 'floor_area', label: '対象の広さは？（概算で可）', type: 'number', required: true, unit: '㎡', placeholder: '例：80' },
    { key: 'items', label: '含まれるものは？（複数選択可）', type: 'checkbox', required: true,
      options: ['什器・オフィス家具', '家電（冷蔵庫・エアコン等）', 'OA機器・パソコン', '厨房機器', '在庫・商品', '産業廃棄物にあたるもの', 'わからない'] },
    { key: 'access', label: '搬出の条件は？（複数選択可）', type: 'checkbox',
      options: ['エレベーターが使える', '階段のみ（2階以上）', 'トラックを横付けできる', '駐車スペースが限られる', 'わからない'] },
    { key: 'deadline', label: '期限はありますか？', type: 'radio', required: true,
      options: ['1週間以内', '1か月以内', '2〜3か月以内', '期限は未定'] },
    { key: 'free_text', label: 'ご要望・補足（任意）', type: 'textarea',
      placeholder: '例：退去日が決まっている／マニフェストの発行が必要／買取も相談したい など（400字まで）' },
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
