import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { NotificationPoller } from "@/components/NotificationPoller"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Pintell",
  description: "Keep track of your Pintell devices",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NotificationPoller />
          {children}
        </ThemeProvider>
        <Toaster 
          richColors 
          position="top-center"
          offset={10}
          expand={true}
          closeButton={true}
        />
      </body>
    </html>
  )
}

