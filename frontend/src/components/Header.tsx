"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              AI-IR Insight
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/stocks" className="text-gray-600 hover:text-gray-900">
                銘柄一覧
              </Link>
              <Link href="/sectors" className="text-gray-600 hover:text-gray-900">
                業種別
              </Link>
              <Link href="/documents" className="text-gray-600 hover:text-gray-900">
                IR資料
              </Link>
              <Link href="/vtuber" className="text-gray-600 hover:text-gray-900">
                台本生成
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.name || user.email}</span>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    管理
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ログイン
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  登録
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
