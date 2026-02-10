from datetime import date
from typing import List, Optional
import random

from sqlalchemy.orm import Session

import models
import schemas


def get_or_create_social_posts(
    db: Session,
    req: schemas.SentimentAnalysisRequest
) -> List[models.SocialPost]:

    posts = (
        db.query(models.SocialPost)
        .filter(
            models.SocialPost.product_name == req.product_name,
            models.SocialPost.brand_name == req.brand_name,
            models.SocialPost.platform == req.platform,
            models.SocialPost.posted_at >= req.start_date,
            models.SocialPost.posted_at <= req.end_date,
        )
        .all()
    )

    if posts:
        return posts

    # If no posts in range, generate synthetic YouTube comments
    days = (req.end_date - req.start_date).days + 1

    for i in range(days * 5):
        dt = req.start_date + (req.end_date - req.start_date) * random.random()

        post = models.SocialPost(
            platform=req.platform,
            product_name=req.product_name,
            brand_name=req.brand_name,
            posted_at=date.fromordinal(int(dt.toordinal())),
            content=f"Synthetic YouTube comment {i} on {req.product_name}",
        )

        db.add(post)

    db.commit()
    return get_or_create_social_posts(db, req)


def get_comments(
    db: Session,
    product_name: str,
    brand_name: str,
    platform: str,
    sentiment_filter: Optional[str] = None,
) -> List[models.SocialPost]:

    query = (
        db.query(models.SocialPost)
        .join(
            models.SentimentScore,
            models.SentimentScore.post_id == models.SocialPost.id,
            isouter=True,
        )
        .filter(
            models.SocialPost.product_name == product_name,
            models.SocialPost.brand_name == brand_name,
            models.SocialPost.platform == platform,
        )
    )

    if sentiment_filter:
        query = query.filter(models.SentimentScore.sentiment_label == sentiment_filter)

    return query.all()


def upsert_prediction(
    db: Session,
    product_name: str,
    brand_name: str,
    date_value: date,
    loss_probability: float,
    drop_pct: float,
    risk_level: str,
    explanation: str,
) -> models.Prediction:

    pred = (
        db.query(models.Prediction)
        .filter(
            models.Prediction.product_name == product_name,
            models.Prediction.brand_name == brand_name,
            models.Prediction.date == date_value,
        )
        .first()
    )

    if not pred:
        pred = models.Prediction(
            product_name=product_name,
            brand_name=brand_name,
            date=date_value,
        )
        db.add(pred)

    pred.loss_probability = loss_probability
    pred.predicted_drop_percentage = drop_pct
    pred.risk_level = risk_level
    pred.explanation = explanation

    db.commit()
    db.refresh(pred)
    return pred


def get_sales_range(
    db: Session,
    product_name: str,
    brand_name: str,
    start_date: date,
    end_date: date,
) -> List[models.SalesData]:

    return (
        db.query(models.SalesData)
        .filter(
            models.SalesData.product_name == product_name,
            models.SalesData.brand_name == brand_name,
            models.SalesData.date >= start_date,
            models.SalesData.date <= end_date,
        )
        .order_by(models.SalesData.date)
        .all()
    )
