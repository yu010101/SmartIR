from typing import Dict, Any, Optional
import os
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

class VTuberScriptGenerator:
    """AIVtuber用の台本を生成するクラス"""
    
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # キャラクター設定
        self.character_profile = """
        キャラクター名: アイリス (Iris)
        設定:
        - 22歳の女性VTuber
        - 投資アナリストとして働きながら、VTuberとして活動
        - 性格: 明るく知的で、難しい金融用語も分かりやすく説明するのが得意
        - 口調: フレンドリーで親しみやすい。「です/ます」調をベースに、時々タメ口も混ぜる
        - 特徴: 株式市場の動きを擬人化して説明するのが特徴
        """
    
    def generate_script(self, analysis_result: Dict[str, Any], company_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        分析結果から配信用の台本を生成
        
        Args:
            analysis_result (Dict[str, Any]): LLM分析の結果
            company_info (Dict[str, Any]): 企業情報
            
        Returns:
            Optional[Dict[str, Any]]: 生成した台本
        """
        try:
            # 台本生成用のプロンプト
            prompt = f"""
            以下の企業情報とIR分析結果から、VTuberが5分程度で話せる台本を作成してください。

            キャラクター設定:
            {self.character_profile}

            企業情報:
            企業名: {company_info["name"]}
            証券コード: {company_info["ticker_code"]}
            業種: {company_info["sector"]}

            分析結果:
            要約: {analysis_result["summary"]}
            重要ポイント:
            {chr(10).join(analysis_result["key_points"])}
            
            センチメント:
            ポジティブ: {analysis_result["sentiment"]["positive"]}
            ネガティブ: {analysis_result["sentiment"]["negative"]}
            ニュートラル: {analysis_result["sentiment"]["neutral"]}

            台本の形式:
            1. 挨拶と企業紹介
            2. IR情報の要点説明（分かりやすい例えを使用）
            3. 重要ポイントの解説
            4. 視聴者へのアドバイスやまとめ
            5. 締めの挨拶

            注意点:
            - 専門用語は可能な限り分かりやすく言い換える
            - 明るく親しみやすい口調を維持
            - 具体的な投資アドバイスは避ける
            - 適度に擬人化や例えを使用
            """
            
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "あなたはVTuber向けの台本作家です。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            script = response.choices[0].message.content
            
            # 台本に感情表現や演出指示を追加
            enriched_script = self._add_performance_notes(script)
            
            return {
                "script": enriched_script,
                "duration_estimate": "5分",
                "character_name": "アイリス",
                "company_name": company_info["name"]
            }
            
        except Exception as e:
            logger.error(f"Script generation failed: {str(e)}")
            return None
    
    def _add_performance_notes(self, script: str) -> str:
        """台本に感情表現や演出指示を追加"""
        prompt = f"""
        以下の台本に、VTuberの感情表現や演出指示を追加してください。
        例:
        - (笑顔で)
        - (真剣な表情で)
        - (手振りを交えながら)
        - (画面に図を表示しながら)
        
        台本:
        {script}
        """
        
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "あなたはVTuber向けの台本作家です。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        return response.choices[0].message.content 