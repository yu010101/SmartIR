import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { SiteOrganizationData, WebSiteData } from "@/components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://smartir-web-silk.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "AI-IR Insight - AIによるIR資料分析プラットフォーム",
    template: "%s | AI-IR Insight",
  },
  description:
    "上場企業のIR資料をAIが自動分析。決算短信、有価証券報告書の要約・センチメント分析で投資判断をサポート。",
  keywords: ["IR分析", "決算", "株式投資", "AI", "決算短信", "有価証券報告書", "企業分析"],
  authors: [{ name: "AI-IR Insight" }],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: "AI-IR Insight",
    title: "AI-IR Insight - AIによるIR資料分析プラットフォーム",
    description:
      "上場企業のIR資料をAIが自動分析。決算短信、有価証券報告書の要約・センチメント分析で投資判断をサポート。",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-IR Insight - AIによるIR資料分析プラットフォーム",
    description: "上場企業のIR資料をAIが自動分析。投資判断をサポート。",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <SiteOrganizationData />
        <WebSiteData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <AuthProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
