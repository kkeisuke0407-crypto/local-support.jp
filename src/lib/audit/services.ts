import type { AuditService, FacilityType } from './types.ts';

/**
 * 診断対象サービス（27サービス）。
 * id は src/data/services の slug と一致させ、結果カードから既存LPへ内部リンクできるようにする。
 *
 * weight（標準化補正・0以下）の考え方：
 *   点検内容が法令で固定され、業者を変えても差が出にくいもの＝マイナス（🟡寄り）。
 *   清掃・除去・工事・保守委託など、頻度や範囲で差が出やすいもの＝0（🔴寄り）。
 */
export const AUDIT_SERVICES: AuditService[] = [
  // ── 法定点検系（業者間差が出にくいものは weight < 0）──
  { id: 'shobo-setsubi',        label: '消防設備点検',          group: '法定点検', weight: -2, featured: true },
  { id: 'bouka-tenken',         label: '防火対象物点検',        group: '法定点検', weight: -2 },
  { id: 'jusuisou-seisou',      label: '受水槽清掃',            group: '法定点検', weight: 0,  featured: true },
  { id: 'jikayou-denki',        label: 'キュービクル点検',      group: '法定点検', weight: -1, featured: true },
  { id: 'elevator-hoshu',       label: 'エレベーター保守',      group: '法定点検', weight: -1, featured: true },
  { id: 'furon-tenken',         label: 'フロン排出抑制法点検',  group: '法定点検', weight: -1 },
  { id: 'tokushu-kenchiku',     label: '特殊建築物定期調査',    group: '法定点検', weight: -1 },
  { id: 'shutter',              label: 'シャッター点検・修理',  group: '法定点検', weight: -1 },
  { id: 'johkasou',             label: '浄化槽清掃・保守',      group: '法定点検', weight: 0 },
  { id: 'signboard-inspection', label: '看板・屋外広告物点検',  group: '法定点検', weight: 0 },

  // ── 衛生・設備系（範囲・頻度で差が出やすい＝0）──
  { id: 'pest-control',  label: '害虫駆除',              group: '衛生・設備', weight: 0, featured: true },
  { id: 'aircon-business', label: '業務用エアコン洗浄',  group: '衛生・設備', weight: 0, featured: true },
  { id: 'duct',          label: 'ダクト清掃',            group: '衛生・設備', weight: 0, featured: true },
  { id: 'haisuikan',     label: '排水管高圧洗浄',        group: '衛生・設備', weight: 0, featured: true },
  { id: 'grease-trap',   label: 'グリストラップ清掃',    group: '衛生・設備', weight: 0 },
  { id: 'reito-reizou',  label: '業務用冷凍冷蔵メンテ',  group: '衛生・設備', weight: 0 },

  // ── 建物・大規模修繕系（スポット・差が大きい＝0）──
  { id: 'gaiheki-toso',  label: '外壁塗装・修繕',        group: '建物・大規模', weight: 0 },
  { id: 'yane-fukikae',  label: '屋根葺き替え・修理',    group: '建物・大規模', weight: 0 },
  { id: 'asbestos',      label: 'アスベスト調査・除去',  group: '建物・大規模', weight: 0 },
  { id: 'kaitai',        label: '建物解体工事',          group: '建物・大規模', weight: 0 },
  { id: 'zanchibutsu',   label: '残置物撤去・不用品回収', group: '建物・大規模', weight: 0 },

  // ── 設備投資系 ──
  { id: 'solar-cleaning', label: '太陽光パネル清掃',     group: '設備投資', weight: 0 },
  { id: 'solar-om',       label: '太陽光発電所O&M',      group: '設備投資', weight: 0 },
  { id: 'chikudenchi',    label: '蓄電池導入',           group: '設備投資', weight: 0 },
  { id: 'bohan-camera',   label: '防犯カメラ・防犯設備', group: '設備投資', weight: 0 },
  { id: 'nyutaishitsu',   label: '入退室管理システム',   group: '設備投資', weight: 0 },

  // ── その他 ──
  { id: 'office-iten',   label: 'オフィス移転',          group: 'その他', weight: 0 },
];

export const SERVICE_BY_ID: Record<string, AuditService> =
  Object.fromEntries(AUDIT_SERVICES.map((s) => [s.id, s]));

/** Q2 上位クイック選択（featured）。残りは「もっと見る」で展開。 */
export const FEATURED_SERVICES = AUDIT_SERVICES.filter((s) => s.featured);

/** 施設種別の表示ラベルと、メール ref からの事前選択用キー */
export const FACILITY_LABELS: Record<FacilityType, string> = {
  kaigo: '介護施設',
  byoin: '病院',
  clinic: 'クリニック',
  mansion: 'マンション',
  shogyo: '商業施設',
  office: 'オフィス',
  kojo: '工場',
  other: 'その他',
};
