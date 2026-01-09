import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getStockByTicker,
  getStockAnalysis,
  getAllTickerCodes,
} from "@/lib/public-api";
import { StructuredData } from "@/components/StructuredData";
import type { Document, StockAnalysis } from "@/types";

interface PageProps {
  params: Promise<{ code: string }>;
}

// 動的レンダリング（ビルド時のAPI依存を回避）
export const dynamic = "force-dynamic";

// 静的パラメータを生成（SSG） - ビルド時はスキップ
export async function generateStaticParams() {
  // ビルド時はAPIが利用できないため空配列を返す
  // ページは初回アクセス時に生成される（ISR）
  return [];
}

// 動的メタデータ生成
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;

  try {
    const stock = await getStockByTicker(code);

    const title = `${stock.name}（${stock.ticker_code}）の決算・IR情報 | AI-IR Insight`;
    const description = `${stock.name}のIR資料をAIが分析。決算短信、有価証券報告書の要約と感情分析で投資判断をサポート。${stock.sector ? `業種: ${stock.sector}` : ""}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "銘柄が見つかりません | AI-IR Insight",
    };
  }
}

// 1時間ごとに再生成
export const revalidate = 3600;

function SentimentBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const percentage = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 w-20">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 w-10 text-right">
        {percentage}%
      </span>
    </div>
  );
}

function AnalysisSection({ analysis }: { analysis: StockAnalysis }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">AI分析結果</h2>
        <span className="text-sm text-gray-500">
          {new Date(analysis.analyzed_at).toLocaleDateString("ja-JP")}更新
        </span>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">分析対象: {analysis.document_title}</p>
        <p className="text-sm text-gray-500">公開日: {analysis.publish_date}</p>
      </div>

      {/* 要約 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">AI要約</h3>
        <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* センチメント分析 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">センチメント分析</h3>
        <div className="space-y-2">
          <SentimentBar
            label="ポジティブ"
            value={analysis.sentiment_positive}
            color="bg-green-500"
          />
          <SentimentBar
            label="ネガティブ"
            value={analysis.sentiment_negative}
            color="bg-red-500"
          />
          <SentimentBar
            label="ニュートラル"
            value={analysis.sentiment_neutral}
            color="bg-gray-400"
          />
        </div>
      </div>

      {/* キーポイント */}
      {analysis.key_points.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">重要ポイント</h3>
          <ul className="space-y-2">
            {analysis.key_points.map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DocumentList({ documents }: { documents: Document[] }) {
  const docTypeLabels: Record<string, string> = {
    financial_report: "決算短信",
    annual_report: "有価証券報告書",
    press_release: "プレスリリース",
    presentation: "決算説明会資料",
    other: "その他",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">最新のIR資料</h2>
      {documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">{doc.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                    {docTypeLabels[doc.doc_type] || doc.doc_type}
                  </span>
                  <span className="text-sm text-gray-500">{doc.publish_date}</span>
                </div>
              </div>
              {doc.source_url && (
                <a
                  href={doc.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  PDF
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">IR資料がまだありません</p>
      )}
    </div>
  );
}

export default async function StockDetailPage({ params }: PageProps) {
  const { code } = await params;

  let stock;
  try {
    stock = await getStockByTicker(code);
  } catch {
    notFound();
  }

  const analysis = await getStockAnalysis(code);

  // 構造化データ
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: stock.name,
    tickerSymbol: stock.ticker_code,
    url: stock.website_url || undefined,
    description: stock.description || `${stock.name}のIR情報`,
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "ホーム",
        item: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "銘柄一覧",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"}/stocks`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: stock.name,
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"}/stocks/${stock.ticker_code}`,
      },
    ],
  };

  return (
    <>
      <StructuredData data={structuredData} />
      <StructuredData data={breadcrumbData} />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* パンくずリスト */}
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-blue-600">
              ホーム
            </Link>
            <span className="mx-2">/</span>
            <Link href="/stocks" className="hover:text-blue-600">
              銘柄一覧
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{stock.name}</span>
          </nav>

          {/* ヘッダー */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-lg font-mono text-gray-500">
                  {stock.ticker_code}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mt-1">
                  {stock.name}
                </h1>
              </div>
              {stock.website_url && (
                <a
                  href={stock.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  公式サイト →
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {stock.sector && (
                <Link
                  href={`/sectors/${encodeURIComponent(stock.sector)}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  {stock.sector}
                </Link>
              )}
              {stock.industry && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  {stock.industry}
                </span>
              )}
            </div>

            {stock.description && (
              <p className="text-gray-600 mt-4">{stock.description}</p>
            )}

            <p className="text-sm text-gray-500 mt-4">
              IR資料: {stock.document_count}件
            </p>
          </div>

          {/* AI分析結果 */}
          {analysis && <AnalysisSection analysis={analysis} />}

          {/* 分析結果がない場合 */}
          {!analysis && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 text-center">
              <p className="text-gray-500">
                AI分析結果はまだありません。IR資料が処理されると自動的に分析が行われます。
              </p>
            </div>
          )}

          {/* 最新のIR資料 */}
          <div className="mt-6">
            <DocumentList documents={stock.recent_documents} />
          </div>
        </div>
      </div>
    </>
  );
}
