from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class SocialPost(Base):
    __tablename__ = "social_posts"

    id = Column(Integer, primary_key=True, index=True)
    platform = Column(String, index=True)
    product_name = Column(String, index=True)
    brand_name = Column(String, index=True)
    posted_at = Column(Date, index=True)
    content = Column(String)

    sentiment = relationship("SentimentScore", back_populates="post", uselist=False)


class SentimentScore(Base):
    __tablename__ = "sentiment_scores"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("social_posts.id"))
    sentiment_label = Column(String, index=True)
    sentiment_score = Column(Float)

    post = relationship("SocialPost", back_populates="sentiment")


class SalesData(Base):
    __tablename__ = "sales_data"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, index=True)
    brand_name = Column(String, index=True)
    date = Column(Date, index=True)
    units_sold = Column(Integer)
    revenue = Column(Float)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, index=True)
    brand_name = Column(String, index=True)
    date = Column(Date, index=True)
    loss_probability = Column(Float)
    predicted_drop_percentage = Column(Float)
    risk_level = Column(String)
    explanation = Column(String)


