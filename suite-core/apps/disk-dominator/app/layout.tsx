import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AIAssistantProvider } from "@/components/providers/ai-assistant-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Disk Dominator",
  description: "Administra tu espacio en disco de manera eficiente",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="darkreader-lock" content="true" />
      </head>
      <body className={inter.className} style={{ margin: 0, padding: 0, overflow: "hidden" }}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AIAssistantProvider>{children}</AIAssistantProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
