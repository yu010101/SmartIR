// 企業
export interface Company {
  id: number;
  name: string;
  ticker_code: string;
  sector?: string;
  industry?: string;
  description?: string;
  website_url?: string;
  created_at: string;
  updated_at: string;
}

// ドキュメント
export type DocumentType =
  | "financial_report"
  | "annual_report"
  | "press_release"
  | "presentation"
  | "other";

export interface Document {
  id: number;
  company_id: number;
  title: string;
  doc_type: DocumentType;
  publish_date: string;
  source_url: string;
  storage_url?: string;
  is_processed: boolean;
  raw_text?: string;
  created_at: string;
  updated_at: string;
}

// 分析結果
export interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
}

export interface AnalysisResult {
  summary: string;
  sentiment: SentimentScore;
  key_points: string[];
  processing_time?: number;
}

// 台本
export interface VTuberScript {
  script: string;
  duration_estimate: string;
  character_name: string;
  company_name: string;
  generated_at: string;
}

// 認証
export interface User {
  id: number;
  email: string;
  name?: string;
  role: "admin" | "user" | "premium";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

// クローラー
export interface CrawlResult {
  company_code: string;
  title: string;
  publish_date: string;
  doc_type: string;
  source_url: string;
}

export interface CrawlResponse {
  status: string;
  message: string;
  count: number;
  results: CrawlResult[];
}

// 公開API用型定義（SEO）
export interface StockListResponse {
  total: number;
  stocks: Company[];
}

export interface StockDetail extends Company {
  recent_documents: Document[];
  document_count: number;
}

export interface StockAnalysis {
  document_id: number;
  document_title: string;
  publish_date: string;
  summary: string;
  sentiment_positive: number;
  sentiment_negative: number;
  sentiment_neutral: number;
  key_points: string[];
  analyzed_at: string;
}

export interface SectorInfo {
  name: string;
  stock_count: number;
}

export interface SectorListResponse {
  sectors: SectorInfo[];
}

export interface SectorStocksResponse {
  sector: string;
  total: number;
  stocks: Company[];
}
