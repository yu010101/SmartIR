import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSectorStocks, getAllSectors } from "@/lib/public-api";
import { StructuredData } from "@/components/StructuredData";
import type { Company } from "@/types";

interface PageProps {
  params: Promise<{ sector: string }>;
}

// 動的レンダリング（ビルド時のAPI依存を回避）
export const dynamic = "force-dynamic";

// 静的パラメータを生成 - ビルド時はスキップ
export async function generateStaticParams() {
  // ビルド時はAPIが利用できないため空配列を返す
  return [];
}

// 動的メタデータ生成
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sector: encodedSector } = await params;
  const sector = decodeURIComponent(encodedSector);

  const title = `${sector}関連銘柄一覧 | AI-IR Insight`;
  const description = `${sector}セクターの上場企業一覧。各社のIR資料をAIが分析し、決算情報を要約。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

// 1時間ごとに再生成
export const revalidate = 3600;

function StockCard({ stock }: { stock: Company }) {
  return (
    <Link href={`/stocks/${stock.ticker_code}`}>
      <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-sm font-mono text-gray-500">
              {stock.ticker_code}
            </span>
            <h3 className="text-lg font-semibold text-gray-900 mt-1">
              {stock.name}
            </h3>
          </div>
        </div>
        {stock.industry && (
          <p className="text-sm text-gray-500 mt-2">{stock.industry}</p>
        )}
      </div>
    </Link>
  );
}

export default async function SectorDetailPage({ params }: PageProps) {
  const { sector: encodedSector } = await params;
  const sector = decodeURIComponent(encodedSector);

  let data;
  try {
    data = await getSectorStocks(sector, 0, 500);
  } catch {
    notFound();
  }

  const { stocks, total } = data;

  // 構造化データ
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
        name: "業種一覧",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"}/sectors`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: sector,
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"}/sectors/${encodeURIComponent(sector)}`,
      },
    ],
  };

  return (
    <>
      <StructuredData data={breadcrumbData} />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* パンくずリスト */}
          <nav className="text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-blue-600">
              ホーム
            </Link>
            <span className="mx-2">/</span>
            <Link href="/sectors" className="hover:text-blue-600">
              業種一覧
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{sector}</span>
          </nav>

          {/* ヘッダー */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {sector}関連銘柄
            </h1>
            <p className="text-gray-600 mt-2">
              {total.toLocaleString()}銘柄のIR資料をAIが分析中
            </p>
          </div>

          {/* 銘柄グリッド */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stocks.map((stock) => (
              <StockCard key={stock.id} stock={stock} />
            ))}
          </div>

          {stocks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              この業種の銘柄が見つかりませんでした
            </div>
          )}
        </div>
      </div>
    </>
  );
}
