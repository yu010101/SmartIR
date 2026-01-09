/**
 * JSON-LD構造化データコンポーネント
 * SEO向けにリッチスニペットを生成
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://smartir-web-silk.vercel.app";

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
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [],
  };

  return <StructuredData data={data} />;
}

/**
 * WebSite 構造化データ（検索ボックス対応）
 */
export function WebSiteData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AI-IR Insight",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/stocks?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return <StructuredData data={data} />;
}

/**
 * パンくずリスト構造化データ
 */
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbData({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };

  return <StructuredData data={data} />;
}

/**
 * 株式銘柄の構造化データ（FinancialProduct）
 */
interface StockStructuredDataProps {
  tickerCode: string;
  name: string;
  description?: string;
  sector?: string;
  industry?: string;
}

export function StockStructuredData({
  tickerCode,
  name,
  description,
  sector,
  industry,
}: StockStructuredDataProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Corporation",
    name: name,
    tickerSymbol: tickerCode,
    description: description || `${name}（${tickerCode}）のIR資料・決算情報`,
    url: `${SITE_URL}/stocks/${tickerCode}`,
    ...(sector && {
      industry: {
        "@type": "Text",
        name: sector,
      },
    }),
    ...(industry && {
      naics: industry,
    }),
  };

  return <StructuredData data={data} />;
}

/**
 * FAQ構造化データ
 */
interface FAQItem {
  question: string;
  answer: string;
}

export function FAQData({ items }: { items: FAQItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return <StructuredData data={data} />;
}

/**
 * 記事・分析レポートの構造化データ
 */
interface ArticleStructuredDataProps {
  title: string;
  description: string;
  publishDate: string;
  modifiedDate?: string;
  url: string;
}

export function ArticleStructuredData({
  title,
  description,
  publishDate,
  modifiedDate,
  url,
}: ArticleStructuredDataProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    datePublished: publishDate,
    dateModified: modifiedDate || publishDate,
    url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
    publisher: {
      "@type": "Organization",
      name: "AI-IR Insight",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    author: {
      "@type": "Organization",
      name: "AI-IR Insight",
    },
  };

  return <StructuredData data={data} />;
}

/**
 * ItemList構造化データ（一覧ページ用）
 */
interface ListItem {
  name: string;
  url: string;
  position?: number;
}

export function ItemListData({
  items,
  name
}: {
  items: ListItem[];
  name: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: item.position || index + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };

  return <StructuredData data={data} />;
}
