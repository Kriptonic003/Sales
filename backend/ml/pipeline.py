from datetime import date, timedelta
from typing import List
import numpy as np

from sqlalchemy.orm import Session
from sklearn.linear_model import LogisticRegression, LinearRegression

import models
import schemas
import crud


class SentimentSummary:
    def __init__(self, average_sentiment: float, negative_percentage: float, total_posts: int):
        self.average_sentiment = average_sentiment
        self.negative_percentage = negative_percentage
        self.total_posts = total_posts


class SentimentAndSalesPipeline:
    def __init__(self):
        self.loss_classifier = LogisticRegression()
        self.sales_regressor = LinearRegression()
        self._trained = False

    def _score_text(self, text: str) -> float:
        text_lower = text.lower()
        score = 0.0
        if any(w in text_lower for w in ["love", "great", "good", "awesome", "amazing"]):
            score += 0.6
        if any(w in text_lower for w in ["bad", "terrible", "hate", "bug", "issue", "slow"]):
            score -= 0.7
        return max(min(score, 1.0), -1.0)

    def analyze_posts(self, db: Session, posts: List[models.SocialPost]) -> SentimentSummary:
        if not posts:
            return SentimentSummary(0.0, 0.0, 0)

        total_score = 0.0
        negative = 0

        for post in posts:
            score = self._score_text(post.content)
            label = "neutral"
            if score > 0.2:
                label = "positive"
            elif score < -0.2:
                label = "negative"
                negative += 1

            total_score += score

            if not post.sentiment:
                db.add(
                    models.SentimentScore(
                        post_id=post.id,
                        sentiment_label=label,
                        sentiment_score=score,
                    )
                )

        db.commit()

        return SentimentSummary(
            average_sentiment=total_score / len(posts),
            negative_percentage=(negative / len(posts)) * 100.0,
            total_posts=len(posts),
        )

    def _train_models(self, revenues: List[float], avg_sentiments: List[float]):
        X = np.array([[s] for s in avg_sentiments])
        y_loss = np.array([1 if s < 0 else 0 for s in avg_sentiments])
        y_sales = np.array(revenues)

        if len(np.unique(y_loss)) < 2:
            y_loss[0] = 1 - y_loss[0]

        self.loss_classifier.fit(X, y_loss)
        self.sales_regressor.fit(X, y_sales)
        self._trained = True

    def predict_sales_loss(self, db: Session, req: schemas.SalesLossPredictionRequest):
        posts = crud.get_or_create_social_posts(
            db,
            schemas.SentimentAnalysisRequest(
                product_name=req.product_name,
                brand_name=req.brand_name,
                platform=req.platform,
                start_date=req.start_date,
                end_date=req.end_date,
            ),
        )

        summary = self.analyze_posts(db, posts)

        sales_rows = crud.get_sales_range(
            db,
            req.product_name,
            req.brand_name,
            req.start_date - timedelta(days=30),
            req.end_date,
        )

        revenues = [r.revenue for r in sales_rows] if sales_rows else [10000.0] * 30
        avg_sentiments = [summary.average_sentiment for _ in revenues]

        self._train_models(revenues, avg_sentiments)

        X_today = np.array([[summary.average_sentiment]])
        loss_prob = float(self.loss_classifier.predict_proba(X_today)[0][1])
        predicted_revenue = float(self.sales_regressor.predict(X_today)[0])
        recent_rev = revenues[-1]

        drop_pct = max(0.0, (recent_rev - predicted_revenue) / recent_rev * 100.0)

        risk = "Low" if loss_prob < 0.33 else "Medium" if loss_prob < 0.66 else "High"

        crud.upsert_prediction(
            db,
            req.product_name,
            req.brand_name,
            req.end_date,
            loss_prob,
            drop_pct,
            risk,
            "Auto-generated prediction",
        )

        return schemas.SalesLossPredictionResponse(
            product_name=req.product_name,
            brand_name=req.brand_name,
            predicted_drop_percentage=drop_pct,
            loss_probability=loss_prob,
            confidence=1.0,
            risk_level=risk,
            explanation="Prediction based on sentiment trends.",
        )

    # ✅ DASHBOARD (NO AUTO DATA CREATION)
    def build_dashboard(self, db: Session, product_name: str, brand_name: str, platform: str):
        posts = crud.get_social_posts_only(db, product_name, brand_name, platform)

        # 🚫 NO COMMENTS → EMPTY DASHBOARD
        if not posts:
            return schemas.DashboardResponse(
                kpis=schemas.KPISection(
                    average_sentiment=0.0,
                    negative_percentage=0.0,
                    predicted_sales_drop=0.0,
                    risk_level="Low",
                ),
                sentiment_trend=[],
                sentiment_distribution={
                    "positive": 0,
                    "neutral": 0,
                    "negative": 0,
                },
                comment_volume=[],
                sales_series=[],
                ai_insights=["No comments available to generate dashboard analytics."],
                alerts=[],
            )

        today = date.today()
        start = today - timedelta(days=30)

        summary = self.analyze_posts(db, posts)

        sales_rows = crud.get_sales_range(db, product_name, brand_name, start, today)
        revenues = [r.revenue for r in sales_rows] if sales_rows else [10000.0] * len(posts)
        avg_sentiments = [summary.average_sentiment for _ in revenues]

        self._train_models(revenues, avg_sentiments)

        sentiment_trend = []
        comment_volume = []
        sentiment_distribution = {"positive": 0, "neutral": 0, "negative": 0}

        posts_by_day = {}
        for p in posts:
            posts_by_day.setdefault(p.posted_at, []).append(p)

        for d, day_posts in sorted(posts_by_day.items()):
            scores = []
            for p in day_posts:
                if p.sentiment:
                    scores.append(p.sentiment.sentiment_score)
                    sentiment_distribution[p.sentiment.sentiment_label] += 1

            avg_score = float(np.mean(scores)) if scores else 0.0

            sentiment_trend.append(
                schemas.SentimentDailyPoint(
                    date=d,
                    average_sentiment=avg_score,
                    total_posts=len(day_posts),
                )
            )

            comment_volume.append(
                schemas.SentimentDailyPoint(
                    date=d,
                    average_sentiment=avg_score,
                    total_posts=len(day_posts),
                )
            )

        sales_series = [
            schemas.SalesPoint(
                date=r.date,
                actual_revenue=r.revenue,
                predicted_revenue=r.revenue,
            )
            for r in sales_rows
        ]

        return schemas.DashboardResponse(
            kpis=schemas.KPISection(
                average_sentiment=summary.average_sentiment,
                negative_percentage=summary.negative_percentage,
                predicted_sales_drop=0.0,
                risk_level="Low",
            ),
            sentiment_trend=sentiment_trend,
            sentiment_distribution=sentiment_distribution,
            comment_volume=comment_volume,
            sales_series=sales_series,
            ai_insights=[
                f"Average sentiment over 30 days: {summary.average_sentiment:.2f}",
                f"Negative comment share: {summary.negative_percentage:.1f}%",
            ],
            alerts=[],
        )
