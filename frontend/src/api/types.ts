export type Platform = "Twitter" | "Reddit";

export interface SentimentAnalysisResponse {
  product_name: string;
  platform: string;
  average_sentiment: number;
  negative_percentage: number;
  total_posts: number;
  start_date: string;
  end_date: string;
}

export interface SalesLossPredictionResponse {
  product_name: string;
  brand_name: string;
  predicted_drop_percentage: number;
  loss_probability: number;
  confidence: number;
  risk_level: string;
  explanation: string;
}

export interface KPISection {
  average_sentiment: number;
  negative_percentage: number;
  predicted_sales_drop: number;
  risk_level: string;
}

export interface SentimentDailyPoint {
  date: string;
  average_sentiment: number;
  total_posts: number;
}

export interface SalesPoint {
  date: string;
  actual_revenue: number;
  predicted_revenue: number;
}

export interface DashboardResponse {
  kpis: KPISection;
  sentiment_trend: SentimentDailyPoint[];
  sentiment_distribution: Record<string, number>;
  comment_volume: SentimentDailyPoint[];
  sales_series: SalesPoint[];
  ai_insights: string[];
  alerts: string[];
}

export interface SocialPostOut {
  id: number;
  platform: string;
  product_name: string;
  brand_name: string;
  posted_at: string;
  content: string;
  sentiment_label?: string;
  sentiment_score?: number;
}

export interface ChatResponse {
  reply: string;
}

