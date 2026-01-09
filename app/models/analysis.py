from sqlalchemy import Column, Integer, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class AnalysisResult(BaseModel):
    """分析結果の永続化モデル"""
    __tablename__ = "analysis_results"

    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    sentiment_positive = Column(Float, nullable=False, default=0.0)
    sentiment_negative = Column(Float, nullable=False, default=0.0)
    sentiment_neutral = Column(Float, nullable=False, default=0.0)
    key_points = Column(JSON, default=list)

    # リレーションシップ
    document = relationship("Document", backref="analysis_results")

    def __repr__(self):
        return f"<AnalysisResult(document_id={self.document_id}, sentiment_positive={self.sentiment_positive})>"
