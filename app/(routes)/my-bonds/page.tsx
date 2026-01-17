"use client"

import { Suspense, useState, useEffect } from "react"
import { GovtBondsGrid } from "@/components/govt-bonds-grid"
import { Loader2, Wallet, FileText } from "lucide-react"
import { MyBondsHeader } from "@/components/generated-headers"
import { useWeb3AuthContext } from "@/components/providers"
import type { IBond } from "@/lib/models/Bond"

export default function MyBondsPage() {
    const { walletAddress, loggedIn } = useWeb3AuthContext()
    const [bonds, setBonds] = useState<(IBond & { _id: string })[]>([])
    const [loading, setLoading] = useState(true)
    const [holdings, setHoldings] = useState<Record<string, number>>({})

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch all available bonds
                const bondsRes = await fetch('/api/bonds')
                const allBonds = await bondsRes.json()

                if (loggedIn && walletAddress) {
                    // 2. Fetch user's investments using the wallet address
                    // This bypasses the issue where the User DB model might not have the wallet address linked yet.
                    const investmentsRes = await fetch(`/api/investments?address=${walletAddress}`)
                    const investmentsData = await investmentsRes.json()

                    if (investmentsData.success) {
                        // 3. Calculate holdings
                        const newHoldings: Record<string, number> = {}
                        investmentsData.data.forEach((inv: any) => {
                            if (!newHoldings[inv.bondId]) newHoldings[inv.bondId] = 0

                            if (inv.type === 'INVEST') {
                                newHoldings[inv.bondId] += inv.amount
                            } else if (inv.type === 'REDEEM') {
                                newHoldings[inv.bondId] -= inv.amount
                            }
                        })
                        setHoldings(newHoldings)

                        // 4. Filter bonds to only those user owns
                        const userBonds = allBonds.filter((b: any) => (newHoldings[b.bondId] || 0) > 0)
                        setBonds(userBonds)
                    } else {
                        // If fetching investments fails or returns no data, show empty
                        setBonds([])
                    }
                } else {
                    // Not logged in -> No bonds to show
                    setBonds([])
                }
            } catch (error) {
                console.error("Failed to fetch data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [loggedIn, walletAddress])

    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 lg:px-8">
                {/* Header Section */}
                <MyBondsHeader />

                {/* Bonds Grid */}
                {loading ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-[#FD8C00]" />
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        {!loggedIn ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="bg-[#1A1A1A] p-4 rounded-full mb-4">
                                    <Wallet className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Connect Wallet</h3>
                                <p className="text-gray-400 max-w-md">
                                    Please connect your wallet to view your active bond holdings.
                                </p>
                            </div>
                        ) : bonds.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="bg-[#1A1A1A] p-4 rounded-full mb-4">
                                    <FileText className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">No Active Investments</h3>
                                <p className="text-gray-400 max-w-md">
                                    You don't have any active bond investments yet. Visit the Govt Bonds page to start investing.
                                </p>
                            </div>
                        ) : (
                            <GovtBondsGrid bonds={bonds} basePath="/my-bonds" holdings={holdings} />
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
