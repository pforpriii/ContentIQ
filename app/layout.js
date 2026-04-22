import './globals.css'

export const metadata = {
  title: 'ContentIQ — LinkedIn Content Strategy',
  description: 'AI-powered LinkedIn content strategy. Analyze creators, research trends, and generate content ideas tailored to your brand.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
