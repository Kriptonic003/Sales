from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas, crud, database
from .ml.pipeline import SentimentAndSalesPipeline
from .mock_data import bootstrap_mock_data
from .services.chatbot import generate_chat_response


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


@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    try:
        bootstrap_mock_data(db)
    finally:
        db.close()


@app.post("/analyze-sentiment", response_model=schemas.SentimentAnalysisResponse)
def analyze_sentiment(request: schemas.SentimentAnalysisRequest, db: Session = Depends(get_db)):
    posts = crud.get_or_create_social_posts(db, request)
    sentiments = pipeline.analyze_posts(db, posts)
    return schemas.SentimentAnalysisResponse(
        product_name=request.product_name,
        platform=request.platform,
        average_sentiment=sentiments.average_sentiment,
        negative_percentage=sentiments.negative_percentage,
        total_posts=sentiments.total_posts,
        start_date=request.start_date,
        end_date=request.end_date,
    )


@app.post("/predict-sales-loss", response_model=schemas.SalesLossPredictionResponse)
def predict_sales_loss(request: schemas.SalesLossPredictionRequest, db: Session = Depends(get_db)):
    prediction = pipeline.predict_sales_loss(db, request)
    return prediction


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


