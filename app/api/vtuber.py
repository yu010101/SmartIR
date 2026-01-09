from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import time
import logging

from app.core.database import get_db
from app.core.pdf_utils import PDFExtractor
from app.services.llm_analyzer import LLMAnalyzer
from app.services.vtuber_script import VTuberScriptGenerator
from app.models.document import Document
from app.models.company import Company
from app.schemas.vtuber import (
    ScriptGenerationRequest,
    ScriptGenerationFromDocumentRequest,
    ScriptGenerationResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/vtuber",
    tags=["vtuber"],
    responses={404: {"description": "Not found"}},
)

# サービスのインスタンス
llm_analyzer = LLMAnalyzer()
script_generator = VTuberScriptGenerator()


@router.post("/generate-script", response_model=ScriptGenerationResponse)
def generate_script(request: ScriptGenerationRequest):
    """分析結果から台本を生成"""
    # 分析結果を辞書形式に変換
    analysis_result = {
        "summary": request.analysis_result.summary,
        "sentiment": request.analysis_result.sentiment,
        "key_points": request.analysis_result.key_points,
    }

    # 企業情報を辞書形式に変換
    company_info = {
        "name": request.company_info.name,
        "ticker_code": request.company_info.ticker_code,
        "sector": request.company_info.sector or "不明",
    }

    result = script_generator.generate_script(analysis_result, company_info)

    if result is None:
        raise HTTPException(status_code=500, detail="Script generation failed")

    return ScriptGenerationResponse(
        script=result["script"],
        duration_estimate=result["duration_estimate"],
        character_name=result["character_name"],
        company_name=result["company_name"],
    )


@router.post("/generate-script-from-document", response_model=ScriptGenerationResponse)
def generate_script_from_document(
    request: ScriptGenerationFromDocumentRequest,
    db: Session = Depends(get_db)
):
    """ドキュメントIDから台本を生成（PDF抽出→分析→台本生成）"""
    # ドキュメント取得
    document = db.query(Document).filter(Document.id == request.document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    # 企業情報取得
    company = db.query(Company).filter(Company.id == document.company_id).first()
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")

    # テキスト取得または抽出
    text = document.raw_text
    if not text and document.source_url:
        text = PDFExtractor.extract_from_url(document.source_url)
        if text:
            document.raw_text = text
            document.is_processed = True
            db.commit()

    if not text:
        raise HTTPException(status_code=400, detail="No text available for analysis")

    # 分析実行
    analysis_result = llm_analyzer.analyze(text, document.doc_type.value)
    if analysis_result is None:
        raise HTTPException(status_code=500, detail="Analysis failed")

    # 企業情報を辞書形式に変換
    company_info = {
        "name": company.name,
        "ticker_code": company.ticker_code,
        "sector": company.sector or "不明",
    }

    # 台本生成
    result = script_generator.generate_script(analysis_result, company_info)

    if result is None:
        raise HTTPException(status_code=500, detail="Script generation failed")

    return ScriptGenerationResponse(
        script=result["script"],
        duration_estimate=result["duration_estimate"],
        character_name=result["character_name"],
        company_name=result["company_name"],
    )
