import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { Providers } from "@/components/providers"
import '@rainbow-me/rainbowkit/styles.css';

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

// Updated metadata for NanoBond with Laika-inspired aesthetic
export const metadata: Metadata = {
  title: "NanoBond – Fractional Government Bonds on Blockchain",
  description:
    "Invest in USDT-backed government bond fractions with stablecoins. Transparent, accessible, and secure fractional bond investment platform.",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#0A0A0A] text-white`}>
        <AuthProvider>
          <Providers>
            {children}
          </Providers>
        </AuthProvider>
      </body>
    </html>
  )
}