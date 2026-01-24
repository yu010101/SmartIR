from typing import Dict, Any, Optional
import os
from openai import OpenAI
import logging
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate

logger = logging.getLogger(__name__)

class LLMAnalyzer:
    """LLMを使用してテキストを要約・分析するクラス"""

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key) if api_key else None
        self.enabled = api_key is not None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=2000,
            chunk_overlap=200,
            length_function=len
        )
        
        # プロンプトテンプレート
        self.summary_template = PromptTemplate(
            input_variables=["text"],
            template="""
            以下の文章は企業のIR資料からの抜粋です。
            重要なポイントを3点にまとめ、その後に200文字程度の要約を作成してください。
            
            文章:
            {text}
            
            形式:
            重要ポイント:
            1. 
            2. 
            3. 
            
            要約:
            """
        )
    
    def analyze(self, text: str, doc_type: str) -> Optional[Dict[str, Any]]:
        """
        テキストを要約・分析

        Args:
            text (str): 分析対象のテキスト
            doc_type (str): 文書タイプ

        Returns:
            Optional[Dict[str, Any]]: 分析結果
        """
        if not self.enabled:
            logger.warning("LLM Analyzer is disabled (OPENAI_API_KEY not set)")
            return None

        try:
            # テキストを分割
            chunks = self.text_splitter.split_text(text)
            
            results = []
            # 各チャンクを要約
            for chunk in chunks:
                prompt = self.summary_template.format(text=chunk)
                
                response = self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": "あなたは企業のIR情報を分析する専門家です。"},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3
                )
                
                results.append(response.choices[0].message.content)
            
            # 全体をまとめる
            final_summary = self._combine_summaries(results)
            
            # センチメント分析
            sentiment = self._analyze_sentiment(final_summary)
            
            return {
                "summary": final_summary,
                "sentiment": sentiment,
                "key_points": self._extract_key_points(final_summary)
            }
            
        except Exception as e:
            logger.error(f"LLM analysis failed: {str(e)}")
            return None
    
    def _combine_summaries(self, summaries: list) -> str:
        """複数の要約を1つにまとめる"""
        if len(summaries) == 1:
            return summaries[0]
            
        combined_text = "\n\n".join(summaries)
        prompt = f"""
        以下は同じ文書の異なる部分の要約です。
        これらを1つの包括的な要約にまとめてください。
        
        {combined_text}
        """
        
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "あなたは企業のIR情報を分析する専門家です。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        return response.choices[0].message.content
    
    def _analyze_sentiment(self, text: str) -> Dict[str, float]:
        """テキストのセンチメントを分析"""
        prompt = f"""
        以下の文章について、ポジティブ・ネガティブ・ニュートラルの度合いを0-1の数値で評価してください。
        合計が1になるようにしてください。
        
        文章:
        {text}
        
        形式:
        {{"positive": X.XX, "negative": X.XX, "neutral": X.XX}}
        """
        
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "あなたは企業のIR情報を分析する専門家です。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        try:
            import json
            return json.loads(response.choices[0].message.content)
        except:
            return {"positive": 0.33, "negative": 0.33, "neutral": 0.34}
    
    def _extract_key_points(self, text: str) -> list:
        """テキストから重要なポイントを抽出"""
        lines = text.split("\n")
        key_points = []
        
        for line in lines:
            if line.strip().startswith("1.") or line.strip().startswith("2.") or line.strip().startswith("3."):
                key_points.append(line.strip())
        
        return key_points 