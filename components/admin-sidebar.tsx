"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    FileText,
    PlusCircle,
    List,
    UploadCloud,
    Lock,
    Calendar,
    ClipboardList,
    Settings,
    LogOut
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function AdminSidebar() {
    const pathname = usePathname()
    const { logout } = useAuth()
    const { state } = useSidebar()

    const content = useContentTranslation({
        dashboard: "Dashboard",
        new_bond: "New Bond",
        view_bonds: "View All Bonds",
        pending_verif: "Pending Verifications",
        vault_mgmt: "Vault Management",
        yield_sched: "Yield Scheduling",
        audit_logs: "Audit Logs",
        settings: "Settings",
        logout: "Logout",
        bonds_group: "Bonds",
        vault_group: "Vault & Audit"
    })

    const mainNavItems = [
        { label: content.dashboard, icon: LayoutDashboard, href: "/admin" },
    ]

    const bondItems = [
        { label: content.new_bond, icon: PlusCircle, href: "/admin", isActive: true },
        { label: content.view_bonds, icon: List, href: "/admin/bonds" },
    ]

    const vaultItems = [
        { label: content.pending_verif, icon: UploadCloud, href: "/admin/verifications" },
        { label: content.vault_mgmt, icon: Lock, href: "/admin/vault" },
        { label: content.yield_sched, icon: Calendar, href: "/admin/yield" },
    ]

    const auditItems = [
        { label: content.audit_logs, icon: ClipboardList, href: "/admin/logs" },
        { label: content.settings, icon: Settings, href: "/admin/settings" },
    ]

    return (
        <Sidebar collapsible="icon" className="border-r border-border/50 bg-[#0A0A0A]">
            <SidebarHeader className="flex flex-row items-center gap-2 px-4 py-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FD8C00] to-orange-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-lg">G</span>
                </div>
                {state === "expanded" && <span className="text-xl font-bold text-white tracking-tight">Admin<span className="text-[#FD8C00]">Panel</span></span>}
            </SidebarHeader>

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
                    <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{content.bonds_group}</SidebarGroupLabel>
                </div>

                <SidebarMenu>
                    {bondItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href || (item.label === content.new_bond && pathname === "/admin")}
                                tooltip={item.label}
                                className={cn(
                                    "hover:bg-[#FD8C00]/10 hover:text-[#FD8C00] transition-all",
                                    (pathname === item.href || (item.label === content.new_bond && pathname === "/admin")) && "bg-[#FD8C00]/10 text-[#FD8C00] shadow-[0_0_15px_-3px_rgba(253,140,0,0.3)]",
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
                    <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{content.vault_group}</SidebarGroupLabel>
                </div>

                <SidebarMenu>
                    {[...vaultItems, ...auditItems].map((item) => (
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
            </SidebarContent>

            <SidebarFooter className="px-2 pb-6">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={logout}
                            tooltip="Logout"
                            className="hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>{content.logout}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
