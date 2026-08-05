import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'

import './globals.css'
import { AppShell } from '@/components/shell/app-shell'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Siare Private Investments | Feasibility Platform',
  description: 'Property Development Feasibility Assessment Platform',
}

/**
 * The root layout stays a Server Component so `metadata` keeps working; the
 * shell is a Client Component because the navigation needs to know which route
 * is active, and only a client hook can tell it that.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
