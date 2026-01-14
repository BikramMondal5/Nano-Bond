"use client"

import { useState, useEffect } from "react"
import { InvestmentCard } from "@/components/investment-card"
import { MetricsPanel } from "@/components/metrics-panel"
import { InvestmentRules } from "@/components/investment-rules"
import { BondSelector, BondOption } from "@/components/bond-selector"
import { Loader2, ShieldCheck, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useWeb3Auth } from "@/hooks/use-web3auth"
import { kycService } from "@/lib/services/kyc.service"
import type { IBond } from "@/lib/models/Bond"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export default function InvestPage() {
  const router = useRouter()
  const { walletAddress } = useWeb3Auth()
  const content = useContentTranslation({
    title: "Invest in Government Bonds",
    subtitle: "Purchase fractional bonds with instant settlement and zero gas fees.",
    select_label: "Select Bond Product",
    no_bonds: "No bonds available at the moment."
  });

  const [bonds, setBonds] = useState<IBond[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBondId, setSelectedBondId] = useState<string>("")

  // KYC State
  const [isKYCVerified, setIsKYCVerified] = useState<boolean | null>(null)
  const [kycLoading, setKycLoading] = useState(true)

  useEffect(() => {
    const checkKYC = async () => {
      if (!walletAddress) {
        setKycLoading(false)
        return
      }
      try {
        const { isVerified } = await kycService.checkStatus(walletAddress)
        setIsKYCVerified(isVerified)
      } catch (error) {
        console.error("KYC check failed", error)
      } finally {
        setKycLoading(false)
      }
    }
    checkKYC()
  }, [walletAddress])

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

  const selectedBond = bonds.find(b => b.bondId === selectedBondId) || bonds[0]

  const bondOptions: BondOption[] = bonds.map(b => ({
    bondId: b.bondId,
    bondName: b.bondName,
    description: b.description
  }))

  if (kycLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  // Not Connected or Not Verified UI
  if (walletAddress && isKYCVerified === false) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-4xl text-center space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-center">
          <div className="p-6 bg-primary/10 rounded-full">
            <ShieldCheck className="w-16 h-16 text-primary" />
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Identity Verification Required</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            To comply with government regulations, all investors must complete a one-time KYC verification before purchasing bonds.
          </p>
        </div>
        <div className="pt-4">
          <Button
            size="lg"
            onClick={() => router.push('/verification')}
            className="text-lg px-8 py-6 h-auto"
          >
            Complete Verification
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header & Selector */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{content.title}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {content.subtitle}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted-foreground">{content.select_label}</span>
            <BondSelector
              bonds={bondOptions}
              selectedBondId={selectedBondId}
              onSelect={setSelectedBondId}
              loading={loading}
            />
          </div>
        </div>

        {!selectedBond ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-xl">
            <p>{content.no_bonds}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Core Action Zone */}
            <div className="lg:col-span-7">
              <InvestmentCard bond={selectedBond} />
            </div>

            {/* Supplemental Info */}
            <div className="lg:col-span-5 space-y-8">
              <MetricsPanel bond={selectedBond} />
            </div>
          </div>
        )}

        <InvestmentRules />
      </div>
    </div>
  )
}

