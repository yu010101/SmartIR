// 企業
export interface Company {
  id: number;
  name: string;
  ticker_code: string;
  sector?: string;
  industry?: string;
  description?: string;
  website_url?: string;
  document_count?: number;
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
  script_type: string;
  title: string;
  generated_at: string;
}

// 台本タイプ
export type ScriptTypeId =
  | "ir_document"
  | "morning_market"
  | "earnings_season"
  | "theme_stock"
  | "technical_analysis"
  | "portfolio_review"
  | "fear_greed_commentary";

export interface ScriptType {
  id: ScriptTypeId;
  name: string;
  description: string;
  duration: string;
  required_inputs: string[];
  icon: string;
}

export interface ScriptTypesResponse {
  script_types: ScriptType[];
}

// 台本生成リクエスト
export interface MorningMarketScriptRequest {
  previous_day_summary?: string;
  today_events?: string;
}

export interface EarningsSeasonScriptRequest {
  tickers: string[];
  earnings_data?: Array<{
    ticker: string;
    name: string;
    revenue?: string;
    revenue_yoy?: number;
    operating_income?: string;
    oi_yoy?: number;
    net_income?: string;
    ni_yoy?: number;
    vs_consensus?: string;
  }>;
}

export interface ThemeStockScriptRequest {
  theme: string;
  theme_stocks?: Array<{
    ticker: string;
    name: string;
    sector?: string;
    price?: number;
    theme_relation?: string;
  }>;
}

export interface TechnicalAnalysisScriptRequest {
  ticker: string;
  stock_info?: {
    name?: string;
    price?: number;
    change?: number;
    change_percent?: number;
  };
  chart_data?: {
    ma5?: number;
    ma25?: number;
    ma75?: number;
    rsi14?: number;
    macd?: string;
    bollinger?: string;
    volume_trend?: string;
    pattern?: string;
  };
}

export interface PortfolioPosition {
  ticker: string;
  name: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  unrealized_pnl: number;
  pnl_percent: number;
}

export interface PortfolioSummary {
  total_value: number;
  weekly_pnl: number;
  weekly_return: number;
  ytd_return?: number;
  max_drawdown?: number;
  sharpe_ratio?: number;
  beta?: number;
}

export interface PortfolioReviewScriptRequest {
  positions: PortfolioPosition[];
  portfolio_summary: PortfolioSummary;
}

export interface SentimentScriptRequest {
  fear_greed_index?: number;
  change?: number;
  week_ago?: number;
  month_ago?: number;
  momentum?: string;
  strength?: string;
  breadth?: string;
  put_call?: string;
  vix?: number;
  safe_haven?: string;
  junk_bond?: string;
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

// SadTalker - Lip Sync Video Generation
export type SadTalkerStatus =
  | "pending"
  | "downloading_models"
  | "processing"
  | "completed"
  | "failed";

export interface SadTalkerJob {
  job_id: string;
  status: SadTalkerStatus;
  progress: number;
  output_path?: string;
  error?: string;
}

export interface SadTalkerGenerateParams {
  pose_style?: number;
  batch_size?: number;
  expression_scale?: number;
  enhancer?: "gfpgan" | null;
  still_mode?: boolean;
  preprocess?: "crop" | "resize" | "full";
  size?: 256 | 512;
}

export interface SadTalkerStatusResponse {
  models_installed: boolean;
  sadtalker_dir: string;
  checkpoints_dir: string;
  output_dir: string;
}

// ウォッチリスト
export type AlertType = "price_above" | "price_below" | "volatility" | "ir_release";

export interface PriceAlert {
  id: number;
  watchlist_item_id: number;
  alert_type: AlertType;
  threshold: number;
  is_triggered: boolean;
  triggered_at?: string;
  created_at: string;
}

export interface WatchlistItem {
  id: number;
  watchlist_id: number;
  ticker_code: string;
  added_at: string;
  target_price_high?: number;
  target_price_low?: number;
  notes?: string;
  alerts: PriceAlert[];
  created_at: string;
}

export interface WatchlistItemWithPrice extends WatchlistItem {
  name?: string;
  current_price?: number;
  price_change?: number;
  price_change_percent?: number;
  is_alert_triggered: boolean;
}

export interface Watchlist {
  id: number;
  user_id: number;
  name: string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface WatchlistWithPrices extends Watchlist {
  items: WatchlistItemWithPrice[];
}

export interface TriggeredAlert {
  alert_id: number;
  watchlist_item_id: number;
  ticker_code: string;
  stock_name?: string;
  alert_type: AlertType;
  threshold: number;
  current_price: number;
  triggered_at: string;
}
