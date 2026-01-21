from datetime import date
from typing import Optional, List

from pydantic import BaseModel


class SentimentAnalysisRequest(BaseModel):
    product_name: str
    brand_name: str
    platform: str
    start_date: date
    end_date: date


class SentimentAnalysisResponse(BaseModel):
    product_name: str
    platform: str
    average_sentiment: float
    negative_percentage: float
    total_posts: int
    start_date: date
    end_date: date


class SalesLossPredictionRequest(BaseModel):
    product_name: str
    brand_name: str
    platform: str
    start_date: date
    end_date: date


class SalesLossPredictionResponse(BaseModel):
    product_name: str
    brand_name: str
    predicted_drop_percentage: float
    loss_probability: float
    confidence: float
    risk_level: str
    explanation: str


class SentimentDailyPoint(BaseModel):
    date: date
    average_sentiment: float
    total_posts: int


class SalesPoint(BaseModel):
    date: date
    actual_revenue: float
    predicted_revenue: float


class KPISection(BaseModel):
    average_sentiment: float
    negative_percentage: float
    predicted_sales_drop: float
    risk_level: str


class DashboardResponse(BaseModel):
    kpis: KPISection
    sentiment_trend: List[SentimentDailyPoint]
    sentiment_distribution: dict
    comment_volume: List[SentimentDailyPoint]
    sales_series: List[SalesPoint]
    ai_insights: List[str]
    alerts: List[str]


class SocialPostOut(BaseModel):
    id: int
    platform: str
    product_name: str
    brand_name: str
    posted_at: date
    content: str
    sentiment_label: Optional[str] = None
    sentiment_score: Optional[float] = None

    class Config:
        orm_mode = True


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


