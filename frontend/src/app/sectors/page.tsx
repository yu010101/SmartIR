import { Metadata } from "next";
import Link from "next/link";
import { getAllSectors } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "業種別銘柄一覧 | AI-IR Insight - AIによるIR資料分析",
  description:
    "業種別に上場企業のIR資料を分析。製造業、情報通信、金融など各セクターの決算情報をAIが要約。",
  openGraph: {
    title: "業種別銘柄一覧 | AI-IR Insight",
    description: "業種別に上場企業のIR資料を分析。各セクターの決算情報をAIが要約。",
    type: "website",
  },
};

// 動的レンダリング（ビルド時のAPI依存を回避）
export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function SectorsPage() {
  const { sectors } = await getAllSectors();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* パンくずリスト */}
        <nav className="text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-blue-600">
            ホーム
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">業種一覧</span>
        </nav>

        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">業種別銘柄一覧</h1>
          <p className="text-gray-600 mt-2">
            {sectors.length}業種の上場企業をAIが分析
          </p>
        </div>

        {/* 業種グリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map((sector) => (
            <Link
              key={sector.name}
              href={`/sectors/${encodeURIComponent(sector.name)}`}
            >
              <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer">
                <h2 className="text-xl font-semibold text-gray-900">
                  {sector.name}
                </h2>
                <p className="text-gray-600 mt-2">
                  {sector.stock_count.toLocaleString()}銘柄
                </p>
              </div>
            </Link>
          ))}
        </div>

        {sectors.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            業種データがありません
          </div>
        )}
      </div>
    </div>
  );
}
