from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime


class CompanyInfo(BaseModel):
    """企業情報（台本生成用）"""
    name: str = Field(..., description="企業名")
    ticker_code: str = Field(..., description="証券コード")
    sector: Optional[str] = Field(None, description="業種")


class AnalysisResult(BaseModel):
    """分析結果（台本生成用）"""
    summary: str = Field(..., description="要約")
    sentiment: Dict[str, float] = Field(..., description="センチメント")
    key_points: List[str] = Field(..., description="重要ポイント")


class ScriptGenerationRequest(BaseModel):
    """台本生成リクエスト"""
    analysis_result: AnalysisResult = Field(..., description="分析結果")
    company_info: CompanyInfo = Field(..., description="企業情報")
    character_name: Optional[str] = Field(default="アイリス", description="キャラクター名")

    class Config:
        json_schema_extra = {
            "example": {
                "analysis_result": {
                    "summary": "2024年度決算は好調で...",
                    "sentiment": {
                        "positive": 0.7,
                        "negative": 0.1,
                        "neutral": 0.2
                    },
                    "key_points": [
                        "1. 売上高15%増",
                        "2. 営業利益20%増",
                        "3. 配当金増額"
                    ]
                },
                "company_info": {
                    "name": "サンプル企業",
                    "ticker_code": "1234",
                    "sector": "テクノロジー"
                }
            }
        }


class ScriptGenerationFromDocumentRequest(BaseModel):
    """ドキュメントIDから台本生成リクエスト"""
    document_id: int = Field(..., description="ドキュメントID")
    character_name: Optional[str] = Field(default="アイリス", description="キャラクター名")


class ScriptGenerationResponse(BaseModel):
    """台本生成レスポンス"""
    script: str = Field(..., description="生成された台本")
    duration_estimate: str = Field(..., description="推定時間")
    character_name: str = Field(..., description="キャラクター名")
    company_name: str = Field(..., description="企業名")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="生成日時")

    class Config:
        json_schema_extra = {
            "example": {
                "script": "皆さん、こんにちは！アイリスです！...",
                "duration_estimate": "5分",
                "character_name": "アイリス",
                "company_name": "サンプル企業",
                "generated_at": "2024-01-01T12:00:00"
            }
        }
