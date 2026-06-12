import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LayoutDashboard, Settings, FileText, PlusSquare, Calculator } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Siare Private Investments | Feasibility Platform",
  description: "Property Development Feasibility Assessment Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable} font-sans bg-gray-50`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-[#0F1923] text-white flex flex-col">
            <div className="p-6">
              <h1 className="text-xl font-bold tracking-wider text-blue-400">SIARE</h1>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Investments</p>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
              <Link href="/" className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-600/10 text-blue-400">
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link href="/deals/new" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                <PlusSquare className="h-5 w-5" />
                <span>New Deal</span>
              </Link>
              <Link href="/deals/quick-test" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                <Calculator className="h-5 w-5" />
                <span>Quick Test</span>
              </Link>
              <Link href="/settings/policy" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                <Settings className="h-5 w-5" />
                <span>Policy Config</span>
              </Link>
            </nav>

            <div className="p-4 border-t border-white/10">
              <div className="flex items-center space-x-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                  JS
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Jules Smith</span>
                  <span className="text-xs text-gray-500">Analyst</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-h-screen">
            <header className="h-16 border-b bg-white flex items-center px-8 justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-500">Workspace / Dashboard</span>
              </div>
            </header>
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
