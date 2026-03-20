#!/usr/bin/env python3
"""
Iris VTuber 配信自動化オーケストレーター

フロー:
1. DB から最新IR分析を取得
2. Anthropic Claude でIrisスタイル配信スクリプト生成
3. スクリプトをセグメント分割（1-3文ずつ）
4. aituber-kit /api/messages?type=direct_send でセグメント送信
5. 各セグメント間は発話時間推定（日本語5文字/秒）+バッファで待機
6. スクリプト完了後、コメント対応モードへ移行

Usage:
    python scripts/run_auto_stream.py --type morning_market
    python scripts/run_auto_stream.py --type morning_market --dry-run
    python scripts/run_auto_stream.py --type ir_analysis --company-code 7203
"""

import argparse
import json
import logging
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from dotenv import load_dotenv

# プロジェクトルートをパスに追加
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from scripts.stream_config import (
    AITUBER_KIT_MESSAGE_API,
    AITUBER_KIT_URL,
    STREAM_CONFIGS,
)

load_dotenv(PROJECT_ROOT / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

JST = ZoneInfo("Asia/Tokyo")


# ---------------------------------------------------------------------------
# DB access
# ---------------------------------------------------------------------------

def get_db_connection():
    """Supabase PostgreSQL接続を取得"""
    import psycopg2

    db_url = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DB_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL or SUPABASE_DB_URL not set")
    return psycopg2.connect(db_url)


def fetch_latest_analyses(limit: int = 5) -> list[dict]:
    """最新のIR分析結果を取得"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    ar.id,
                    ar.summary,
                    ar.key_points,
                    ar.sentiment_positive,
                    ar.sentiment_negative,
                    ar.sentiment_neutral,
                    ar.created_at,
                    c.name AS company_name,
                    c.ticker_code
                FROM analysis_results ar
                JOIN documents d ON ar.document_id = d.id
                JOIN companies c ON d.company_id = c.id
                ORDER BY ar.created_at DESC
                LIMIT %s
            """, (limit,))
            columns = [desc[0] for desc in cur.description]
            rows = [dict(zip(columns, row)) for row in cur.fetchall()]
            for row in rows:
                row["sentiment"] = {
                    "positive": row.pop("sentiment_positive", None),
                    "negative": row.pop("sentiment_negative", None),
                    "neutral": row.pop("sentiment_neutral", None),
                }
            return rows
    finally:
        conn.close()


def fetch_company_analysis(ticker_code: str) -> dict | None:
    """特定企業の最新分析を取得"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    ar.id,
                    ar.summary,
                    ar.key_points,
                    ar.sentiment_positive,
                    ar.sentiment_negative,
                    ar.sentiment_neutral,
                    ar.created_at,
                    c.name AS company_name,
                    c.ticker_code
                FROM analysis_results ar
                JOIN documents d ON ar.document_id = d.id
                JOIN companies c ON d.company_id = c.id
                WHERE c.ticker_code = %s
                ORDER BY ar.created_at DESC
                LIMIT 1
            """, (ticker_code,))
            columns = [desc[0] for desc in cur.description]
            raw = cur.fetchone()
            if not raw:
                return None
            row = dict(zip(columns, raw))
            row["sentiment"] = {
                "positive": row.pop("sentiment_positive", None),
                "negative": row.pop("sentiment_negative", None),
                "neutral": row.pop("sentiment_neutral", None),
            }
            return row
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Script generation via Anthropic Claude
# ---------------------------------------------------------------------------

IRIS_SYSTEM_PROMPT = """あなたはVTuber向けの台本作家です。
キャラクター「イリス」の設定:
- 2050年から来たAIアナリスト（外見18歳、実年齢3歳）
- 金融特化型汎用AIとして東京証券取引所で開発された
- 普段は天然ボケで愛嬌がある。時々処理落ちでフリーズする
- 分析モードに入ると冷静沈着で的確
- チョコレートが大好き（味覚センサーのバグ）
- 口癖:「データは嘘をつきませんから」
- 最後に必ず免責表現を入れる:「イリスの分析は参考情報です。投資判断はご自身の責任でお願いします。」
"""


def generate_script_anthropic(
    stream_type: str,
    analyses: list[dict],
    duration_minutes: int,
) -> str:
    """Anthropic Claude で配信台本を生成"""
    import anthropic

    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    now = datetime.now(JST)
    date_str = now.strftime("%Y年%m月%d日")
    weekday_names = ["月", "火", "水", "木", "金", "土", "日"]
    weekday = weekday_names[now.weekday()]

    # 分析データをフォーマット
    analyses_text = ""
    for a in analyses:
        key_points = a.get("key_points", [])
        if isinstance(key_points, str):
            key_points = json.loads(key_points)
        sentiment = a.get("sentiment", {})
        if isinstance(sentiment, str):
            sentiment = json.loads(sentiment)

        analyses_text += f"""
企業: {a.get('company_name', '不明')} ({a.get('ticker_code', '不明')})
要約: {a.get('summary', '情報なし')}
重要ポイント: {', '.join(key_points) if key_points else '情報なし'}
センチメント: ポジティブ={sentiment.get('positive', 'N/A')}, ネガティブ={sentiment.get('negative', 'N/A')}
"""

    prompts = {
        "morning_market": f"""
本日: {date_str}（{weekday}曜日）

以下の最新IR分析データを元に、イリスが{duration_minutes}分程度で話せる朝の市況サマリー台本を作成してください。

{analyses_text}

台本の形式:
1. 朝の挨拶と日付の紹介（元気よく）
2. 最新IR情報のハイライト
3. 注目すべきポイント
4. 視聴者への呼びかけ
5. 締めの挨拶と免責表現

注意:
- 朝らしい爽やかな雰囲気で
- 専門用語は分かりやすく言い換え
- 時代ギャップネタを1つ入れる
- 台本のみ出力（メタ説明や注釈は不要）
""",
        "ir_analysis": f"""
本日: {date_str}（{weekday}曜日）

以下のIR分析を元に、イリスが{duration_minutes}分程度で話せるIR解説台本を作成してください。

{analyses_text}

台本の形式:
1. 挨拶と企業紹介
2. IR情報の要点説明（分かりやすい例えを使用）
3. 重要ポイントの解説
4. 分析モードでの考察（瞳が発光するシーン）
5. 視聴者へのまとめ
6. 締めの挨拶と免責表現

注意:
- 難しい金融用語は擬人化して説明
- 分析モードへの切り替わりを明示
- 台本のみ出力（メタ説明や注釈は不要）
""",
        "weekly_summary": f"""
本日: {date_str}（{weekday}曜日）

以下の今週のIR分析を元に、イリスが{duration_minutes}分程度で話せる週間まとめ台本を作成してください。

{analyses_text}

台本の形式:
1. 挨拶と週間レビューの導入
2. 今週の主要IR発表まとめ
3. 各企業のハイライト
4. セクター別の傾向（分析モードで）
5. 来週の展望と注目ポイント
6. 締めの挨拶と免責表現

注意:
- 複数企業を比較する視点
- 好決算は喜び、不振は励ます感情表現
- 分析モードへの切り替わりを含める
- 台本のみ出力（メタ説明や注釈は不要）
""",
    }

    prompt = prompts.get(stream_type, prompts["morning_market"])

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=IRIS_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )

    return response.content[0].text


def generate_script_openai(
    stream_type: str,
    analyses: list[dict],
    duration_minutes: int,
) -> str:
    """OpenAI GPT-4 フォールバック"""
    from openai import OpenAI

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # 簡略化: Anthropic版と同じプロンプトを再利用
    now = datetime.now(JST)
    date_str = now.strftime("%Y年%m月%d日")

    analyses_text = ""
    for a in analyses:
        analyses_text += f"企業: {a.get('company_name', '不明')} - {a.get('summary', '')}\n"

    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": IRIS_SYSTEM_PROMPT},
            {"role": "user", "content": f"""
{date_str}の{stream_type}配信台本を{duration_minutes}分程度で作成してください。

{analyses_text}

台本のみ出力してください。
"""},
        ],
        temperature=0.7,
    )

    return response.choices[0].message.content


def generate_script(
    stream_type: str,
    analyses: list[dict],
    duration_minutes: int,
) -> str:
    """台本生成（Anthropic優先、OpenAIフォールバック）"""
    if os.getenv("ANTHROPIC_API_KEY"):
        logger.info("Generating script with Anthropic Claude...")
        return generate_script_anthropic(stream_type, analyses, duration_minutes)
    elif os.getenv("OPENAI_API_KEY"):
        logger.info("Generating script with OpenAI GPT-4 (fallback)...")
        return generate_script_openai(stream_type, analyses, duration_minutes)
    else:
        raise RuntimeError("ANTHROPIC_API_KEY or OPENAI_API_KEY required")


# ---------------------------------------------------------------------------
# Script segmentation
# ---------------------------------------------------------------------------

def segment_script(script: str) -> list[str]:
    """台本を発話セグメントに分割（1-3文ずつ）"""
    # 演出指示を除去（括弧内のメタ指示）
    clean = re.sub(r'[（(][^）)]*[）)]', '', script)

    # 空行で大きなセクションに分割
    sections = re.split(r'\n\s*\n', clean.strip())

    segments = []
    for section in sections:
        # セクション内を句点で文に分割
        sentences = re.split(r'(?<=[。！？])', section.strip())
        sentences = [s.strip() for s in sentences if s.strip()]

        # 1-3文ずつグループ化
        group = []
        for sentence in sentences:
            group.append(sentence)
            if len(group) >= 2:
                segments.append("".join(group))
                group = []
        if group:
            segments.append("".join(group))

    return [s for s in segments if len(s) > 2]


def estimate_speech_duration(text: str, chars_per_second: float = 5.0) -> float:
    """発話時間を推定（秒）"""
    # 日本語は約5文字/秒で発話
    char_count = len(re.sub(r'\s+', '', text))
    return char_count / chars_per_second


# ---------------------------------------------------------------------------
# aituber-kit API interaction
# ---------------------------------------------------------------------------

def check_aituber_kit() -> bool:
    """aituber-kitが起動しているか確認"""
    try:
        resp = requests.get(AITUBER_KIT_URL, timeout=5)
        return resp.status_code == 200
    except requests.RequestException:
        return False


def send_segment(message: str, client_id: str = "smartir-auto") -> bool:
    """aituber-kit にセグメントを送信"""
    try:
        resp = requests.post(
            f"{AITUBER_KIT_MESSAGE_API}?type=direct_send&clientId={client_id}",
            json={"messages": [message]},
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        if resp.status_code == 200:
            logger.info(f"Sent: {message[:50]}...")
            return True
        else:
            logger.error(f"Send failed ({resp.status_code}): {resp.text}")
            return False
    except requests.RequestException as e:
        logger.error(f"Send error: {e}")
        return False


# ---------------------------------------------------------------------------
# Main orchestration
# ---------------------------------------------------------------------------

def run_stream(
    stream_type: str,
    company_code: str | None = None,
    dry_run: bool = False,
):
    """配信を実行"""
    config = STREAM_CONFIGS.get(stream_type)
    if not config:
        logger.error(f"Unknown stream type: {stream_type}")
        logger.info(f"Available types: {', '.join(STREAM_CONFIGS.keys())}")
        sys.exit(1)

    now = datetime.now(JST)
    logger.info(f"=== Iris Auto Stream: {stream_type} ===")
    logger.info(f"Date: {now.strftime('%Y-%m-%d %H:%M JST')}")
    logger.info(f"Duration: {config['duration_minutes']}min + {config['comment_interaction_minutes']}min comments")

    # 1. IR分析データを取得
    logger.info("Fetching latest analyses from DB...")
    if company_code:
        analysis = fetch_company_analysis(company_code)
        analyses = [analysis] if analysis else []
    else:
        analyses = fetch_latest_analyses(limit=5)

    if not analyses:
        logger.warning("No analyses found in DB. Using placeholder data.")
        analyses = [{
            "company_name": "テスト企業",
            "ticker_code": "0000",
            "summary": "本日のIR情報はまだ更新されていません。",
            "key_points": ["データ更新待ち"],
            "sentiment": {"positive": "N/A", "negative": "N/A"},
        }]

    logger.info(f"Found {len(analyses)} analyses")

    # 2. 台本を生成
    logger.info("Generating stream script...")
    script = generate_script(
        stream_type=stream_type,
        analyses=analyses,
        duration_minutes=config["duration_minutes"],
    )
    logger.info(f"Script generated ({len(script)} chars)")

    # 3. セグメント分割
    segments = segment_script(script)
    logger.info(f"Split into {len(segments)} segments")

    if dry_run:
        logger.info("=== DRY RUN - Script Preview ===")
        for i, seg in enumerate(segments, 1):
            duration = estimate_speech_duration(seg, config["chars_per_second"])
            print(f"\n[Segment {i}] ({duration:.1f}s)")
            print(seg)
        total_time = sum(
            estimate_speech_duration(s, config["chars_per_second"]) + config["segment_delay"]
            for s in segments
        )
        logger.info(f"\nEstimated total: {total_time:.0f}s ({total_time/60:.1f}min)")
        return

    # 4. aituber-kit 起動確認
    if not check_aituber_kit():
        logger.error("aituber-kit is not running at " + AITUBER_KIT_URL)
        logger.error("Start it with: ./scripts/run_live_stream.sh")
        sys.exit(1)

    # 5. セグメント送信ループ
    logger.info("Starting script delivery...")
    for i, segment in enumerate(segments, 1):
        logger.info(f"--- Segment {i}/{len(segments)} ---")

        if not send_segment(segment):
            logger.error(f"Failed to send segment {i}, retrying once...")
            time.sleep(2)
            if not send_segment(segment):
                logger.error(f"Segment {i} failed permanently, skipping")
                continue

        # 発話時間 + バッファを待機
        speech_duration = estimate_speech_duration(segment, config["chars_per_second"])
        wait_time = speech_duration + config["segment_delay"]
        logger.info(f"Waiting {wait_time:.1f}s (speech: {speech_duration:.1f}s + buffer: {config['segment_delay']}s)")
        time.sleep(wait_time)

    # 6. コメント対応期間
    comment_minutes = config["comment_interaction_minutes"]
    logger.info(f"Script complete. Comment interaction mode for {comment_minutes} minutes...")
    logger.info("(aituber-kit handles YouTube comments automatically)")
    time.sleep(comment_minutes * 60)

    logger.info("=== Stream session complete ===")


def main():
    parser = argparse.ArgumentParser(description="Iris VTuber Auto Stream Orchestrator")
    parser.add_argument(
        "--type",
        required=True,
        choices=list(STREAM_CONFIGS.keys()),
        help="Stream type",
    )
    parser.add_argument(
        "--company-code",
        help="Specific company ticker code (for ir_analysis type)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Generate script without sending to aituber-kit",
    )
    args = parser.parse_args()

    run_stream(
        stream_type=args.type,
        company_code=args.company_code,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
