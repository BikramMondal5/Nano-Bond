"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Wallet, PlusCircle, ArrowDownLeft, ShieldCheck, Users, History, Settings, LogOut, Landmark } from "lucide-react"
import Image from "next/image"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function AppSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { state } = useSidebar()

  const content = useContentTranslation({
    dashboard: "Dashboard",
    invest: "Invest",
    redeem: "Redeem",
    my_bonds: "My Bonds",
    govt_bonds: "Govt Bonds",
    verification: "Verification",
    transactions: "Market Analysis",
    settings: "Settings",
    logout: "Logout"
  })

  const mainNavItems = [
    { label: content.dashboard, icon: Home, href: "/portfolio" },
    { label: content.invest, icon: PlusCircle, href: "/invest" },
    { label: content.redeem, icon: ArrowDownLeft, href: "/redeem" },
    { label: content.my_bonds, icon: Wallet, href: "/my-bonds" },
    { label: content.govt_bonds, icon: Landmark, href: "/govt-bonds" },
    { label: content.verification, icon: ShieldCheck, href: "/verification" },
    { label: content.transactions, icon: History, href: "/market-analysis" },
    { label: content.settings, icon: Settings, href: "/settings" },
  ]

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-[#0A0A0A]">
      <SidebarHeader className="md:hidden p-4 mb-2">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 transition-transform group-hover:scale-105">
            <Image src="/logo.png" alt="NanoBond" fill className="object-contain" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">NanoBond</span>
        </Link>
      </SidebarHeader>
      <div className="hidden md:block pt-20" />

      <SidebarContent className="px-2">
        <SidebarMenu>
          {mainNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
                className={cn(
                  "hover:bg-[#FD8C00]/10 hover:text-[#FD8C00] transition-all",
                  pathname === item.href && "bg-[#FD8C00]/10 text-[#FD8C00] shadow-[0_0_15px_-3px_rgba(253,140,0,0.3)]",
                )}
              >
                <Link href={item.href}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="my-4 px-2">
          <div className="h-px bg-border/50" />
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip={content.logout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>{content.logout}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>


      </SidebarContent>


    </Sidebar>
  )
}
