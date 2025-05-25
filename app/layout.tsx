import './globals.css'
import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import { AuthProvider } from './providers/AuthProvider'

const nunito = Nunito({ subsets: ['latin', 'cyrillic'], weight: ['400', '700'] })

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
      <body className={nunito.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}


