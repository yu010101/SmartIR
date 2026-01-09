import os
from datetime import datetime, timedelta
from typing import List, Dict, Any
from .base import BaseCrawler
import logging

logger = logging.getLogger(__name__)

class TDNetCrawler(BaseCrawler):
    """TDnetクローラー"""
    
    def __init__(self):
        super().__init__()
        self.base_url = os.getenv("TDNET_API_URL", "https://www.tdnet.info/api/v1/")
    
    def crawl(self, days: int = 1) -> List[Dict[str, Any]]:
        """
        指定日数分のIR資料情報を取得
        
        Args:
            days (int): 何日前までの情報を取得するか（デフォルト: 1日）
        
        Returns:
            List[Dict[str, Any]]: IR資料情報のリスト
        """
        results = []
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        try:
            # TDnetのAPIを呼び出し
            params = {
                "start": start_date.strftime("%Y-%m-%d"),
                "end": end_date.strftime("%Y-%m-%d")
            }
            response = self._get(f"{self.base_url}documents", params=params)
            documents = response.json()
            
            # レスポンスをパース
            for doc in documents:
                try:
                    result = {
                        "company_code": doc["company_code"],
                        "title": doc["title"],
                        "publish_date": doc["publish_date"],
                        "doc_type": self._determine_doc_type(doc["title"]),
                        "source_url": doc["pdf_url"]
                    }
                    results.append(result)
                except KeyError as e:
                    logger.error(f"Invalid document format: {str(e)} - {doc}")
                    continue
                
        except Exception as e:
            logger.error(f"TDNet crawling failed: {str(e)}")
            raise
        
        return results
    
    def _determine_doc_type(self, title: str) -> str:
        """タイトルから資料種別を判定"""
        title = title.lower()
        if "決算短信" in title:
            return "financial_report"
        elif "説明資料" in title or "補足資料" in title:
            return "presentation"
        elif "適時開示" in title:
            return "press_release"
        else:
            return "other" 