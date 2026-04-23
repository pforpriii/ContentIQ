import './globals.css'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'ContentIQ — LinkedIn Content Strategy',
  description:
    'AI-powered LinkedIn content strategy. Analyze creators, research trends, and generate content ideas tailored to your brand.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
