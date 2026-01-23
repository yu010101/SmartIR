from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

from app.api import companies_router, documents_router, analysis_router, vtuber_router, auth_router, crawlers_router, public_router, tts_router, broadcast_router, video_studio_router, market_router, sadtalker_router, jquants_router, watchlist_router, sentiment_router, ml_prediction_router, backtest_router, portfolio_router, technical_router

app = FastAPI(
    title="AI-IR Insight API",
    description="IR資料収集・分析とAIVtuber配信のためのAPI",
    version="0.1.0"
)

# 静的ファイル配信ディレクトリの設定
STATIC_DIR = Path(os.getenv("STATIC_DIR", "./static"))
STATIC_DIR.mkdir(parents=True, exist_ok=True)

# 動画用ディレクトリも作成
(STATIC_DIR / "videos").mkdir(parents=True, exist_ok=True)
(STATIC_DIR / "audio").mkdir(parents=True, exist_ok=True)

# 静的ファイルのマウント
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# CORS設定
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターの登録
app.include_router(companies_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(vtuber_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(crawlers_router, prefix="/api")
app.include_router(public_router, prefix="/api")
app.include_router(tts_router, prefix="/api")
app.include_router(broadcast_router, prefix="/api", tags=["broadcast"])
app.include_router(video_studio_router, prefix="/api", tags=["video-studio"])
app.include_router(market_router, prefix="/api", tags=["market"])
app.include_router(sadtalker_router, tags=["sadtalker"])
app.include_router(jquants_router, prefix="/api", tags=["jquants"])
app.include_router(watchlist_router, prefix="/api", tags=["watchlist"])
app.include_router(sentiment_router, prefix="/api", tags=["sentiment"])
app.include_router(ml_prediction_router, prefix="/api", tags=["ml-prediction"])
app.include_router(backtest_router, prefix="/api", tags=["backtest"])
app.include_router(portfolio_router, prefix="/api", tags=["portfolio"])
app.include_router(technical_router, prefix="/api", tags=["technical"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to AI-IR Insight API",
        "status": "running",
        "environment": os.getenv("APP_ENV", "development")
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "0.1.0"
    }

 