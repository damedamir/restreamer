import './globals.css'

export const metadata = {
  title: 'Restreamer Pro',
  description: 'Professional streaming made simple',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
