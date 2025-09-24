import './globals.css'
import { ToastProvider } from '../contexts/ToastContext'

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
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
