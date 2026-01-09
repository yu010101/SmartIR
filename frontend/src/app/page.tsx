"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import CompanyCard from "@/components/CompanyCard";
import DocumentCard from "@/components/DocumentCard";
import type { Company, Document } from "@/types";

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCompanies(0, 6),
      api.getDocuments(undefined, 7),
    ])
      .then(([companiesData, documentsData]) => {
        setCompanies(companiesData);
        setDocuments(documentsData.slice(0, 10));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヒーローセクション */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-4">AI-IR Insight</h1>
        <p className="text-blue-100 mb-6 max-w-2xl">
          上場企業のIR資料をAIが自動分析。重要ポイントの抽出、センチメント分析、
          さらにはAIVtuberによるエンターテイメント配信まで。
        </p>
        <div className="flex space-x-4">
          <Link
            href="/companies"
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition"
          >
            企業を探す
          </Link>
          <Link
            href="/vtuber"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-400 transition"
          >
            台本生成
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 企業一覧 */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">注目企業</h2>
            <Link href="/companies" className="text-sm text-blue-600 hover:underline">
              すべて見る
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        </div>

        {/* 最新ドキュメント */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">最新IR資料</h2>
            <Link href="/documents" className="text-sm text-blue-600 hover:underline">
              すべて見る
            </Link>
          </div>
          <div className="space-y-3">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
