"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Wallet, PlusCircle, ArrowDownLeft, ShieldCheck, Users, History, Settings, LogOut } from "lucide-react"
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

const mainNavItems = [
  { label: "Dashboard", icon: Home, href: "/portfolio" },
  { label: "My Bonds", icon: Wallet, href: "/bond/us-treasury" },
  { label: "Invest", icon: PlusCircle, href: "/invest" },
  { label: "Redeem", icon: ArrowDownLeft, href: "/redeem" },
  { label: "Verification", icon: ShieldCheck, href: "/verification" },
  { label: "Transactions", icon: History, href: "/transactions" },
  { label: "Settings", icon: Settings, href: "/settings" },
]




export function AppSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-[#0A0A0A]">
      <div className="pt-20" />

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
              tooltip="Logout"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>


      </SidebarContent>


    </Sidebar>
  )
}
