from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api import companies_router, documents_router, analysis_router, vtuber_router, auth_router, crawlers_router, public_router

app = FastAPI(
    title="AI-IR Insight API",
    description="IR資料収集・分析とAIVtuber配信のためのAPI",
    version="0.1.0"
)

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

 