"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Document, Company, VTuberScript } from "@/types";

export default function VTuberPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [companies, setCompanies] = useState<Map<number, Company>>(new Map());
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [script, setScript] = useState<VTuberScript | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getDocuments(undefined, 30), api.getCompanies()])
      .then(async ([docs, comps]) => {
        setDocuments(docs);
        const compMap = new Map<number, Company>();
        comps.forEach((c) => compMap.set(c.id, c));
        setCompanies(compMap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedDocId) return;

    setGenerating(true);
    setError("");
    setScript(null);

    try {
      const result = await api.generateScriptFromDocument(selectedDocId);
      setScript(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "台本生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">AIVtuber台本生成</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左: ドキュメント選択 */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              IR資料を選択
            </h2>
            <select
              value={selectedDocId || ""}
              onChange={(e) => setSelectedDocId(Number(e.target.value) || null)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
            >
              <option value="">ドキュメントを選択してください</option>
              {documents.map((doc) => {
                const company = companies.get(doc.company_id);
                return (
                  <option key={doc.id} value={doc.id}>
                    {company?.name || "不明"} - {doc.title} ({doc.publish_date})
                  </option>
                );
              })}
            </select>

            <button
              onClick={handleGenerate}
              disabled={!selectedDocId || generating}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {generating ? "生成中..." : "台本を生成"}
            </button>

            {error && (
              <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>

          {/* キャラクター情報 */}
          <div className="mt-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-6 border border-pink-100">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              キャラクター: アイリス
            </h3>
            <p className="text-sm text-gray-600">
              22歳の投資アナリスト兼VTuber。難しい金融用語も分かりやすく説明するのが得意。
              明るく知的で、フレンドリーな口調が特徴です。
            </p>
          </div>
        </div>

        {/* 右: 台本プレビュー */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border p-6 min-h-[500px]">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              生成された台本
            </h2>

            {script ? (
              <div>
                <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                  <span>キャラクター: {script.character_name}</span>
                  <span>推定時間: {script.duration_estimate}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {script.script}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-400">
                <p>IR資料を選択して台本を生成してください</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
