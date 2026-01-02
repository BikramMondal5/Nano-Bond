"use client"

import type React from "react"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Footer } from "@/components/footer" // imported Footer to include it globally

// Internal wrapper to handle conditional sidebar logic
function AppSidebarWrapper() {
  const { user } = useAuth()
  const pathname = usePathname()
  const isLanding = pathname === "/"
  const isAuthPage = pathname === "/login" || pathname === "/sign-up"

  if (!user || isLanding || isAuthPage) return null

  return <AppSidebar />
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const showFooter = pathname === '/'

  return (
    <>
      <AuthProvider>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full">
            <AppSidebarWrapper />

            <SidebarInset className="flex flex-col w-full bg-[#0A0A0A]">
              <Navbar />
              <main className="flex-1 pt-16">{children}</main>
              {showFooter && <Footer />}
            </SidebarInset>
          </div>
        </SidebarProvider>
      </AuthProvider>
      <Toaster />
      <Analytics />
    </>
  )
}
