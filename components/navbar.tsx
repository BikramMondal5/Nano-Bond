"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { ChevronDown, User, Settings, LogOut, Menu, Globe } from "lucide-react"
import Image from "next/image"

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
import { Web3AuthConnectButton } from "@/components/web3auth-connect-button"
import { useLanguage } from "@/context/LanguageContext"
import { useContentTranslation } from "@/hooks/useContentTranslation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"



export function Navbar() {
  const { user, login, logout } = useAuth()
  const { language, setLanguage, translateText } = useLanguage()
  const pathname = usePathname()
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/sign-up"

  const content = useContentTranslation({
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
    register: "Register"
  })

  const [navLinks, setNavLinks] = useState([
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Roadmap", href: "/#roadmap" },
    { label: "Docs", href: "/docs" },
    { label: "FAQ", href: "/#faq" },
  ]);

  useEffect(() => {
    const translateLinks = async () => {
      if (language === 'en') {
        setNavLinks([
          { label: "Features", href: "/#features" },
          { label: "How It Works", href: "/#how-it-works" },
          { label: "Roadmap", href: "/#roadmap" },
          { label: "Docs", href: "/docs" },
          { label: "FAQ", href: "/#faq" },
        ]);
        return;
      }

      const labels = ["Features", "How It Works", "Roadmap", "Docs", "FAQ"];
      const translated = await translateText(labels);

      if (Array.isArray(translated)) {
        setNavLinks([
          { label: translated[0], href: "/#features" },
          { label: translated[1], href: "/#how-it-works" },
          { label: translated[2], href: "/#roadmap" },
          { label: translated[3], href: "/docs" },
          { label: translated[4], href: "/#faq" },
        ]);
      }
    };
    translateLinks();
  }, [language, translateText]);

  const showNavLinks =
    isPublicPage ||
    pathname === "/portfolio" ||
    pathname.startsWith("/bond/") ||
    pathname === "/invest" ||
    pathname === "/redeem" ||
    pathname === "/verification"



  return (
    <nav className="fixed top-0 w-full z-40 border-b border-border/50 bg-[#0A0A0A]/90 backdrop-blur-2xl backdrop-saturate-150">
      <div className="w-full px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center gap-4">
            {pathname === "/" && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground hover:text-white">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-[#0A0A0A] border-r border-border/50">
                  <SheetHeader>
                    <SheetTitle className="text-left text-xl font-bold flex items-center gap-2">
                      <div className="relative w-8 h-8">
                        <Image src="/logo.png" alt="NanoBond" fill className="object-contain" />
                      </div>
                      NanoBond
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-1 mt-4 px-6">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-lg font-medium text-white hover:text-[#FD8C00] transition-colors py-2 border-b border-border/10"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            )}
            {user && !isPublicPage && <SidebarTrigger className="md:hidden" />}

            <Link href="/" className="hidden md:flex items-center gap-2 group">
              <div className="relative w-8 h-8 transition-transform group-hover:scale-105">
                <Image src="/logo.png" alt="NanoBond" fill className="object-contain" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">NanoBond</span>
            </Link>
          </div>

          {/* Center: Navigation Links (only on public pages or portfolio) */}
          {showNavLinks && (
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-white relative group"
                  title={`Language: ${language.toUpperCase()}`}
                >
                  <Globe className="w-5 h-5" />
                  <span className="absolute -bottom-1 right-0 text-[10px] font-bold text-[#FD8C00]">
                    {language.toUpperCase()}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-border/50 text-white">
                <DropdownMenuItem onClick={() => setLanguage('en')} className="cursor-pointer hover:bg-white/10">
                  English (EN)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('es')} className="cursor-pointer hover:bg-white/10">
                  Español (ES)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('fr')} className="cursor-pointer hover:bg-white/10">
                  Français (FR)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('hi')} className="cursor-pointer hover:bg-white/10">
                  हिन्दी (HI)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('de')} className="cursor-pointer hover:bg-white/10">
                  Deutsch (DE)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                      <User className="w-4 h-4" /> {content.profile}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-[#FD8C00]/10 hover:text-[#FD8C00] cursor-pointer">
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" /> {content.settings}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive hover:bg-destructive/10 cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> {content.logout}
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
                  <Link href="/sign-up">{content.register}</Link>
                </Button>
                <Web3AuthConnectButton />
              </div>
            )}


          </div>
        </div>
      </div>
    </nav>
  )
}
