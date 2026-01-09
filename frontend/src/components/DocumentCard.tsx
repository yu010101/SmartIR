import Link from "next/link";
import type { Document } from "@/types";

interface DocumentCardProps {
  document: Document;
  showCompany?: boolean;
}

const docTypeLabels: Record<string, string> = {
  financial_report: "決算短信",
  annual_report: "有価証券報告書",
  press_release: "プレスリリース",
  presentation: "説明資料",
  other: "その他",
};

const docTypeColors: Record<string, string> = {
  financial_report: "bg-green-100 text-green-800",
  annual_report: "bg-purple-100 text-purple-800",
  press_release: "bg-yellow-100 text-yellow-800",
  presentation: "bg-blue-100 text-blue-800",
  other: "bg-gray-100 text-gray-800",
};

export default function DocumentCard({ document, showCompany }: DocumentCardProps) {
  return (
    <Link href={`/documents/${document.id}`}>
      <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {document.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{document.publish_date}</p>
          </div>
          <span
            className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              docTypeColors[document.doc_type] || docTypeColors.other
            }`}
          >
            {docTypeLabels[document.doc_type] || document.doc_type}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span
            className={`text-xs ${
              document.is_processed ? "text-green-600" : "text-gray-400"
            }`}
          >
            {document.is_processed ? "分析済み" : "未分析"}
          </span>
          <a
            href={document.source_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-blue-600 hover:underline"
          >
            PDF
          </a>
        </div>
      </div>
    </Link>
  );
}
