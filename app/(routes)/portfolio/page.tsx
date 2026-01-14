"use client"

import { useState, useEffect } from "react"
import { usePortfolioData } from "@/hooks/usePortfolioData"
import { PortfolioHero } from "@/components/portfolio-hero"
import { PortfolioChart } from "@/components/portfolio-chart"
import { BondBreakdown } from "@/components/bond-breakdown"
import { RecentActivity } from "@/components/recent-activity"
import { QuickActions } from "@/components/quick-actions"
import { BondSelector, BondOption } from "@/components/bond-selector" // Reusing the selector
import type { IBond } from "@/lib/models/Bond"
import { Loader2, Lock, Eye, EyeOff } from "lucide-react"
import { useContentTranslation } from "@/hooks/useContentTranslation"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function PortfolioPage() {
  const content = useContentTranslation({
    title: "Portfolio",
    loading_msg: "Loading bonds..."
  });

  const { address } = usePortfolioData()
  const router = useRouter()
  const [bonds, setBonds] = useState<IBond[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBondId, setSelectedBondId] = useState<string>("")

  // Admin Access State
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [adminKey, setAdminKey] = useState("")
  const [showPasskey, setShowPasskey] = useState(false)
  const [adminError, setAdminError] = useState("")

  useEffect(() => {
    if (address) {
      console.log("Logged In User Wallet Address:", address)
    }
  }, [address])

  useEffect(() => {
    const fetchBonds = async () => {
      try {
        const res = await fetch('/api/bonds')
        if (!res.ok) throw new Error('Failed to fetch bonds')
        const data = await res.json()
        setBonds(data)
        if (data.length > 0) {
          // Default to first bond if none selected
          setSelectedBondId(data[0].bondId)
        }
      } catch (error) {
        console.error("Failed to load bonds:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBonds()
  }, [])

  const selectedBond = bonds.find(b => b.bondId === selectedBondId)

  const bondOptions: BondOption[] = bonds.map(b => ({
    bondId: b.bondId,
    bondName: b.bondName,
    description: b.description
  }))

  const handleAdminAccess = async () => {
    try {
      const res = await fetch("/api/admin/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: adminKey }),
      })

      if (res.ok) {
        setShowAdminDialog(false)
        router.push("/admin")
      } else {
        const data = await res.json()
        setAdminError(data.error || "Invalid Admin Passkey")
      }
    } catch (error) {
      console.error("Admin access error:", error)
      setAdminError("Something went wrong. Please try again.")
    }
  }

  return (
    <main className="container mx-auto px-4 pt-8 pb-20 space-y-8">
      {/* Header with Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">{content.title}</h1>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{content.loading_msg}</span>
          </div>
        ) : (
          <BondSelector
            bonds={bondOptions}
            selectedBondId={selectedBondId}
            onSelect={setSelectedBondId}
          />
        )}
      </div>

      {/* Pass selected bond to Hero for dynamic data */}
      <PortfolioHero bond={selectedBond} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PortfolioChart />
          {/* We might want to pass all bonds to breakdown to show list, or just selected? 
              For now keeping it as is or passing bonds if intended to be dynamic list. 
              Request was to "fetch token holded for particular bonds" which is covered by Hero + Selector.
          */}
          <BondBreakdown />
        </div>
        <div className="space-y-8">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>

      {/* Admin Access Link */}
      <div className="flex items-center justify-center mt-8 gap-2">
        <span className="text-sm text-muted-foreground">To visits the admin page, authenticate yourself as admin.</span>
        <button
          onClick={() => setShowAdminDialog(true)}
          className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors"
        >
          Are You an Admin?
        </button>
      </div>

      <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
        <DialogContent className="bg-black/90 border-orange-500/20 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange-500">Enter Admin Passkey</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {adminError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {adminError}
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/50" />
              <Input
                type={showPasskey ? "text" : "password"}
                placeholder="Enter passkey"
                className="pl-10 pr-10 bg-black/50 border-orange-500/20 text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-orange-500"
                value={adminKey}
                onChange={(e) => {
                  setAdminKey(e.target.value)
                  if (adminError) setAdminError("")
                }}
                onKeyDown={(e) => e.key === "Enter" && handleAdminAccess()}
              />
              <button
                type="button"
                onClick={() => setShowPasskey(!showPasskey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500/50 hover:text-orange-400 transition-colors"
              >
                {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAdminDialog(false)
                  setAdminKey("")
                  setAdminError("")
                }}
                className="border-orange-500/20 text-gray-300 hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdminAccess}
                className="bg-blue-600 hover:bg-blue-500 text-white border-none"
              >
                Access Admin
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
