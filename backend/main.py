from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import os

from dotenv import load_dotenv

import models
import schemas
import crud
import database

from ml.pipeline import SentimentAndSalesPipeline
from services.chatbot import generate_chat_response
from youtube_client import fetch_youtube_comments

# --------------------------------------------------
# ENV SETUP
# --------------------------------------------------
load_dotenv()

if not os.getenv("YOUTUBE_API_KEY"):
    raise RuntimeError("YOUTUBE_API_KEY not found in environment variables")

# --------------------------------------------------
# DB + APP SETUP
# --------------------------------------------------
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AI Sales Loss Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

pipeline = SentimentAndSalesPipeline()

# --------------------------------------------------
# CORE ENDPOINTS
# --------------------------------------------------

@app.post("/analyze-sentiment", response_model=schemas.SentimentAnalysisResponse)
def analyze_sentiment(
    request: schemas.SentimentAnalysisRequest,
    db: Session = Depends(get_db),
):
    posts = crud.get_or_create_social_posts(db, request)
    summary = pipeline.analyze_posts(db, posts)

    return schemas.SentimentAnalysisResponse(
        product_name=request.product_name,
        platform=request.platform,
        average_sentiment=summary.average_sentiment,
        negative_percentage=summary.negative_percentage,
        total_posts=summary.total_posts,
        start_date=request.start_date,
        end_date=request.end_date,
    )


@app.post("/predict-sales-loss", response_model=schemas.SalesLossPredictionResponse)
def predict_sales_loss(
    request: schemas.SalesLossPredictionRequest,
    db: Session = Depends(get_db),
):
    return pipeline.predict_sales_loss(db, request)


@app.get("/get-dashboard-data", response_model=schemas.DashboardResponse)
def get_dashboard_data(
    product_name: str,
    brand_name: str,
    platform: str,
    db: Session = Depends(get_db),
):
    return pipeline.build_dashboard(db, product_name, brand_name, platform)


@app.get("/comments", response_model=List[schemas.SocialPostOut])
def get_comments(
    product_name: str,
    brand_name: str,
    platform: str,
    sentiment_filter: str | None = None,
    db: Session = Depends(get_db),
):
    return crud.get_comments(db, product_name, brand_name, platform, sentiment_filter)


@app.post("/chat", response_model=schemas.ChatResponse)
def chat(request: schemas.ChatRequest):
    reply = generate_chat_response(request.message)
    return schemas.ChatResponse(reply=reply)

# --------------------------------------------------
# YOUTUBE INTEGRATION (FINAL)
# --------------------------------------------------

@app.post("/fetch-youtube-comments")
def fetch_and_store_youtube_comments(
    product_name: str,
    brand_name: str,
    video_id: str,
    db: Session = Depends(get_db),
):
    comments = fetch_youtube_comments(video_id)

    if not comments:
        raise HTTPException(status_code=404, detail="No comments found")

    saved = crud.save_youtube_comments(
        db=db,
        product_name=product_name,
        brand_name=brand_name,
        platform="YouTube",
        comments=comments,
    )

    return {
        "message": "YouTube comments fetched and stored",
        "count": len(saved),
    }
