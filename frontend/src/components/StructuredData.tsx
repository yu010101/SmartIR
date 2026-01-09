/**
 * JSON-LD構造化データコンポーネント
 * SEO向けにリッチスニペットを生成
 */

interface StructuredDataProps {
  data: Record<string, unknown>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * サイト全体の Organization 構造化データ
 */
export function SiteOrganizationData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AI-IR Insight",
    description: "AIによるIR資料分析とAIVtuber配信プラットフォーム",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
  };

  return <StructuredData data={data} />;
}

/**
 * WebSite 構造化データ（検索ボックス対応）
 */
export function WebSiteData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AI-IR Insight",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/stocks?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return <StructuredData data={data} />;
}
