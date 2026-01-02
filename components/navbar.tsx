"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wallet, ChevronDown, User, Settings, LogOut, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { SidebarTrigger } from "@/components/ui/sidebar"

const publicLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Roadmap", href: "/#roadmap" },
  { label: "Docs", href: "/docs" },
  { label: "FAQ", href: "/#faq" },
]

export function Navbar() {
  const { user, login, logout } = useAuth()
  const pathname = usePathname()
  const isLanding = pathname === "/"

  return (
    <nav className="fixed top-0 w-full z-40 border-b border-border/50 bg-[#0A0A0A]/90 backdrop-blur-2xl backdrop-saturate-150">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center gap-4">
            {user && !isLanding && <SidebarTrigger className="md:hidden" />}

            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FD8C00] to-orange-600 flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-lg">G</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">GovtBond</span>
            </Link>
          </div>

          {/* Center: Navigation Links (only on landing page) */}
          {isLanding && (
            <div className="hidden lg:flex items-center gap-6">
              {publicLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-[#FD8C00] transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FD8C00] transition-all group-hover:w-full" />
                </Link>
              ))}
            </div>
          )}

          {/* Right: Auth/User section */}
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-border/50 bg-[#1A1A1A] hover:bg-[#252525] text-white gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="hidden sm:inline">{user.name || user.email || user.address}</span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[#1A1A1A] border-border/50 text-white">
                  <DropdownMenuItem asChild className="hover:bg-[#FD8C00]/10 hover:text-[#FD8C00] cursor-pointer">
                    <Link href="/portfolio" className="flex items-center gap-2">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-[#FD8C00]/10 hover:text-[#FD8C00] cursor-pointer">
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive hover:bg-destructive/10 cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="border-border/50 bg-[#1A1A1A] hover:bg-[#252525] text-white"
                >
                  <Link href="/sign-up">Register</Link>
                </Button>
                <Button
                  onClick={login}
                  className="bg-[#FD8C00] hover:bg-[#E67E00] text-black font-semibold shadow-[0_0_20px_-5px_rgba(253,140,0,0.5)] transition-all active:scale-95"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              </div>
            )}

            {isLanding && (
              <Button variant="ghost" size="icon" className="lg:hidden text-white">
                <Menu className="w-6 h-6" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
