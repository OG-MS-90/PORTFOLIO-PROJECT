import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/contexts/UserContext'
import { EsopDataProvider } from '@/contexts/EsopDataContext'
import { LayoutWrapper } from '@/components/LayoutWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ESOP Master - Manage Your Employee Stock Options',
  description: 'Comprehensive ESOP management platform with AI-powered financial planning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <EsopDataProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </EsopDataProvider>
        </UserProvider>
      </body>
    </html>
  )
}
