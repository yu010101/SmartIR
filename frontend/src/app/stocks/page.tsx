import { Metadata } from "next";
import Link from "next/link";
import { getAllStocks, getAllSectors } from "@/lib/public-api";
import { BreadcrumbData, ItemListData } from "@/components/StructuredData";
import type { Company, SectorInfo } from "@/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://smartir-web-silk.vercel.app";

export const metadata: Metadata = {
  title: "銘柄一覧 | AI-IR Insight - AIによるIR資料分析",
  description:
    "上場企業のIR資料をAIが自動分析。決算短信、有価証券報告書の要約・センチメント分析で投資判断をサポート。トヨタ、ソニー、任天堂など主要銘柄を網羅。",
  keywords: ["株式", "IR", "決算", "銘柄一覧", "有価証券報告書", "決算短信", "AI分析", "投資"],
  alternates: {
    canonical: `${SITE_URL}/stocks`,
  },
  openGraph: {
    title: "銘柄一覧 | AI-IR Insight",
    description: "上場企業のIR資料をAIが自動分析。決算短信、有価証券報告書の要約・センチメント分析。",
    type: "website",
    url: `${SITE_URL}/stocks`,
    images: [
      {
        url: `${SITE_URL}/api/og?title=${encodeURIComponent("銘柄一覧")}&subtitle=${encodeURIComponent("上場企業のIR資料をAI分析")}`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "銘柄一覧 | AI-IR Insight",
    description: "上場企業のIR資料をAIが自動分析。投資判断をサポート。",
  },
};

// 動的レンダリング（ビルド時のAPI依存を回避）
export const dynamic = "force-dynamic";
export const revalidate = 3600;

function StockCard({ stock }: { stock: Company }) {
  return (
    <Link href={`/stocks/${stock.ticker_code}`}>
      <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-sm font-mono text-gray-500">{stock.ticker_code}</span>
            <h3 className="text-lg font-semibold text-gray-900 mt-1">{stock.name}</h3>
          </div>
        </div>
        {stock.sector && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
            {stock.sector}
          </span>
        )}
        {stock.industry && (
          <p className="text-sm text-gray-500 mt-2">{stock.industry}</p>
        )}
      </div>
    </Link>
  );
}

function SectorFilter({
  sectors,
  currentSector,
}: {
  sectors: SectorInfo[];
  currentSector?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Link
        href="/stocks"
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          !currentSector
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        すべて
      </Link>
      {sectors.map((sector) => (
        <Link
          key={sector.name}
          href={`/sectors/${encodeURIComponent(sector.name)}`}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentSector === sector.name
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {sector.name} ({sector.stock_count})
        </Link>
      ))}
    </div>
  );
}

export default async function StocksPage() {
  const [stocksData, sectorsData] = await Promise.all([
    getAllStocks(0, 1000),
    getAllSectors(),
  ]);

  const { stocks, total } = stocksData;
  const { sectors } = sectorsData;

  // パンくずリスト
  const breadcrumbs = [
    { name: "ホーム", url: "/" },
    { name: "銘柄一覧", url: "/stocks" },
  ];

  // 銘柄リスト（ItemList構造化データ用）
  const stockListItems = stocks.slice(0, 50).map((stock, index) => ({
    name: `${stock.name}（${stock.ticker_code}）`,
    url: `/stocks/${stock.ticker_code}`,
    position: index + 1,
  }));

  return (
    <>
      <BreadcrumbData items={breadcrumbs} />
      <ItemListData items={stockListItems} name="銘柄一覧" />
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* パンくずリスト */}
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-blue-600">
            ホーム
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">銘柄一覧</span>
        </nav>

        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">銘柄一覧</h1>
          <p className="text-gray-600 mt-2">
            {total.toLocaleString()}銘柄のIR資料をAIが分析中
          </p>
        </div>

        {/* 業種フィルター */}
        <SectorFilter sectors={sectors} />

        {/* 銘柄グリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stocks.map((stock) => (
            <StockCard key={stock.id} stock={stock} />
          ))}
        </div>

        {stocks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            銘柄が見つかりませんでした
          </div>
        )}
      </div>
    </div>
    </>
  );
}
