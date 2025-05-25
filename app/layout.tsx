import './globals.css'
import type { Metadata } from 'next'
import { GeistSans, GeistMono } from 'geist/font'
import { AuthProvider } from './providers/AuthProvider'

const geistSans = GeistSans
const geistMono = GeistMono

export const metadata: Metadata = {
  title: 'BitLab - Учебная платформа',
  description: 'Современная платформа для обучения программированию',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={`${geistSans.className} ${geistMono.className}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}


