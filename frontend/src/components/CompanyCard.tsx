import Link from "next/link";
import type { Company } from "@/types";

interface CompanyCardProps {
  company: Company;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link href={`/companies/${company.id}`}>
      <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{company.ticker_code}</p>
          </div>
          {company.sector && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {company.sector}
            </span>
          )}
        </div>
        {company.description && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-2">
            {company.description}
          </p>
        )}
        {company.industry && (
          <p className="mt-2 text-xs text-gray-400">{company.industry}</p>
        )}
      </div>
    </Link>
  );
}
