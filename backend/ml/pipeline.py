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
                sent = models.SentimentScore(
                    post_id=post.id,
                    sentiment_label=label,
                    sentiment_score=score,
                )
                db.add(sent)
        db.commit()

        avg = total_score / len(posts)
        neg_pct = negative / len(posts) * 100.0
        return SentimentSummary(average_sentiment=avg, negative_percentage=neg_pct, total_posts=len(posts))

    def _train_models(
        self,
        revenues: List[float],
        avg_sentiments: List[float],
    ):
        if len(revenues) < 10:
            # Not enough data, create tiny synthetic training
            X = np.array([[s] for s in avg_sentiments])
            y_loss = np.array([1 if s < 0 else 0 for s in avg_sentiments])
            y_sales = np.array(revenues)
        else:
            X = np.array([[s] for s in avg_sentiments])
            y_loss = np.array([1 if r < np.mean(revenues) * 0.9 else 0 for r in revenues])
            y_sales = np.array(revenues)

        if len(np.unique(y_loss)) < 2:
            y_loss[0] = 1 - y_loss[0]

        self.loss_classifier.fit(X, y_loss)
        self.sales_regressor.fit(X, y_sales)
        self._trained = True

    def predict_sales_loss(
        self, db: Session, req: schemas.SalesLossPredictionRequest
    ) -> schemas.SalesLossPredictionResponse:
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
            db, req.product_name, req.brand_name, req.start_date - timedelta(days=30), req.end_date
        )
        if not sales_rows:
            revenues = [10000 + i * 100 for i in range(30)]
            avg_sentiments = [summary.average_sentiment + (i - 15) * 0.01 for i in range(30)]
        else:
            revenues = [row.revenue for row in sales_rows]
            avg_sentiments = [summary.average_sentiment for _ in sales_rows]

        self._train_models(revenues, avg_sentiments)

        X_today = np.array([[summary.average_sentiment]])
        loss_prob = float(self.loss_classifier.predict_proba(X_today)[0][1])
        predicted_revenue = float(self.sales_regressor.predict(X_today)[0])
        recent_rev = revenues[-1]
        drop_pct = max(0.0, (recent_rev - predicted_revenue) / max(recent_rev, 1e-6) * 100.0)

        if loss_prob < 0.33:
            risk = "Low"
        elif loss_prob < 0.66:
            risk = "Medium"
        else:
            risk = "High"

        explanation = (
            f"Detected average sentiment of {summary.average_sentiment:.2f} with "
            f"{summary.negative_percentage:.1f}% negative comments. "
            f"Model predicts a potential revenue drop of {drop_pct:.1f}%."
        )

        crud.upsert_prediction(
            db,
            product_name=req.product_name,
            brand_name=req.brand_name,
            date_value=req.end_date,
            loss_probability=loss_prob,
            drop_pct=drop_pct,
            risk_level=risk,
            explanation=explanation,
        )

        return schemas.SalesLossPredictionResponse(
            product_name=req.product_name,
            brand_name=req.brand_name,
            predicted_drop_percentage=drop_pct,
            loss_probability=loss_prob,
            confidence=1.0,
            risk_level=risk,
            explanation=explanation,
        )

    def build_dashboard(
        self, db: Session, product_name: str, brand_name: str, platform: str
    ) -> schemas.DashboardResponse:
        today = date.today()
        start = today - timedelta(days=30)
        posts = crud.get_or_create_social_posts(
            db,
            schemas.SentimentAnalysisRequest(
                product_name=product_name,
                brand_name=brand_name,
                platform=platform,
                start_date=start,
                end_date=today,
            ),
        )
        summary = self.analyze_posts(db, posts)

        sales_rows = crud.get_sales_range(db, product_name, brand_name, start, today)
        if not sales_rows:
            sales_rows = []
            current = start
            base = 10000.0
            while current <= today:
                sales_rows.append(
                    models.SalesData(
                        product_name=product_name,
                        brand_name=brand_name,
                        date=current,
                        revenue=base,
                        units_sold=int(base / 50),
                    )
                )
                base *= 1.01
                current += timedelta(days=1)

        revenues = [row.revenue for row in sales_rows]
        avg_sentiments = [summary.average_sentiment for _ in sales_rows]
        self._train_models(revenues, avg_sentiments)

        sentiment_trend = []
        comment_volume = []
        sentiment_distribution = {"positive": 0, "neutral": 0, "negative": 0}
        posts_by_day = {}
        for post in posts:
            key = post.posted_at
            posts_by_day.setdefault(key, []).append(post)

        for d in sorted(posts_by_day.keys()):
            day_posts = posts_by_day[d]
            scores = []
            for p in day_posts:
                if p.sentiment:
                    scores.append(p.sentiment.sentiment_score)
                    sentiment_distribution[p.sentiment.sentiment_label] += 1
            avg_score = float(np.mean(scores)) if scores else 0.0
            sentiment_trend.append(
                schemas.SentimentDailyPoint(date=d, average_sentiment=avg_score, total_posts=len(day_posts))
            )
            comment_volume.append(
                schemas.SentimentDailyPoint(date=d, average_sentiment=avg_score, total_posts=len(day_posts))
            )

        X = np.array([[pt.average_sentiment] for pt in sentiment_trend]) if sentiment_trend else np.array([[0.0]])
        pred_revenues = self.sales_regressor.predict(X) if len(X) else []
        sales_series = []
        for i, row in enumerate(sales_rows):
            predicted = float(pred_revenues[i]) if i < len(pred_revenues) else row.revenue
            sales_series.append(
                schemas.SalesPoint(
                    date=row.date,
                    actual_revenue=row.revenue,
                    predicted_revenue=predicted,
                )
            )

        last_pred = self.predict_sales_loss(
            db,
            schemas.SalesLossPredictionRequest(
                product_name=product_name,
                brand_name=brand_name,
                platform=platform,
                start_date=start,
                end_date=today,
            ),
        )

        ai_insights = [
            f"Average sentiment over the last 30 days is {summary.average_sentiment:.2f}.",
            f"Negative comment share is {summary.negative_percentage:.1f}%.",
            f"Predicted revenue drop is {last_pred.predicted_drop_percentage:.1f}% with risk level {last_pred.risk_level}.",
        ]
        alerts = []
        if last_pred.risk_level == "High":
            alerts.append("High risk of upcoming sales loss. Consider launching a mitigation campaign immediately.")
        elif last_pred.risk_level == "Medium":
            alerts.append("Medium risk detected. Monitor sentiment closely and address key complaints.")

        kpis = schemas.KPISection(
            average_sentiment=summary.average_sentiment,
            negative_percentage=summary.negative_percentage,
            predicted_sales_drop=last_pred.predicted_drop_percentage,
            risk_level=last_pred.risk_level,
        )

        return schemas.DashboardResponse(
            kpis=kpis,
            sentiment_trend=sentiment_trend,
            sentiment_distribution=sentiment_distribution,
            comment_volume=comment_volume,
            sales_series=sales_series,
            ai_insights=ai_insights,
            alerts=alerts,
        )


