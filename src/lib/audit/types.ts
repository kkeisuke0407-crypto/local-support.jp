/**
 * AI施設管理診断（30秒版）の型定義
 * ------------------------------------------------------------------
 * 目的：4問（施設種別／気になるサービス／見積取得状況／契約状況）から
 *       サービスごとの「見直し優先度」を算出し、一括見積CVへ誘導する。
 * 設計方針：損失額を断定しない。優先度（高/中/低）を主役にする。
 */

/** Q1：施設種別 */
export type FacilityType =
  | 'kaigo' | 'byoin' | 'clinic' | 'mansion'
  | 'shogyo' | 'office' | 'kojo' | 'other';

/** Q3：施設規模 */
export type FacilitySize = 'xs' | 's' | 'm' | 'l' | 'unknown';

/** Q4：見積もりの取得状況 */
export type QuoteStatus = 'within3y' | 'over4y' | 'never' | 'unknown';

/** Q5：契約の見直し状況 */
export type ContractStatus = 'reviewed' | 'auto' | 'unknown';

/** 見直し優先度 */
export type Level = 'high' | 'mid' | 'low';

/** 診断対象サービス（既存サービスLPの slug と一致させる） */
export interface AuditService {
  /** 既存サービスLPの slug（内部リンク・見積フォーム連携に使用） */
  id: string;
  /** 表示用の短いラベル */
  label: string;
  /** 「もっと見る」での分類ラベル */
  group: ServiceGroup;
  /**
   * 標準化補正（0 以下）。点検内容が法令で固定され業者間差が出にくいものは
   * マイナス（＝🟡寄り）にする。多くは 0（清掃・除去・工事系は差が出やすい＝🔴寄り）。
   */
  weight: number;
  /** Q2 の上位クイック選択に出すか */
  featured?: boolean;
}

export type ServiceGroup = '法定点検' | '衛生・設備' | '建物・大規模' | '設備投資' | 'その他';

/** 診断入力 */
export interface DiagnosisInput {
  facility: FacilityType;
  serviceIds: string[];
  facilitySize: FacilitySize;
  quoteStatus: QuoteStatus;
  contractStatus: ContractStatus;
}

/** サービス単位の診断結果 */
export interface ServiceResult {
  id: string;
  label: string;
  level: Level;
  points: number;
  reasons: string[];
}

/** 診断結果全体 */
export interface DiagnosisResult {
  results: ServiceResult[];
  counts: { high: number; mid: number; low: number };
  /** 施設管理リスクスコア（100 = 健全） */
  score: number;
}
