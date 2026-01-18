"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { VaultControls } from "@/components/admin/vault-controls"
import { TreasuryWithdraw } from "@/components/admin/treasury-withdraw"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function BondDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const { address } = useAccount()
    const [bond, setBond] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchBond() {
            try {
                // Fetch all and find (simpler than new api route for now)
                const res = await fetch('/api/bonds')
                const data = await res.json()
                const found = data.find((b: any) => b.bondId === params.bondId)

                if (found) {
                    setBond(found)
                } else {
                    router.push('/admin/bonds') // Redirect if not found
                }
            } catch (error) {
                console.error("Failed to fetch bond:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchBond()
    }, [params.bondId, router])

    if (isLoading) return <div className="text-white p-10">Loading bond details...</div>
    if (!bond) return null

    // Ownership Check
    const isOwner = bond.adminWallet && address
        ? bond.adminWallet.toLowerCase() === address.toLowerCase()
        : false

    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0A] p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <Link href="/admin/bonds">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-white tracking-tight">{bond.bondName}</h1>
                        <Badge variant="outline" className="border-gray-700 text-gray-400">{bond.bondId}</Badge>
                    </div>
                    <p className="text-gray-400">Issued by {bond.issuer}</p>
                </div>
                {isOwner && (
                    <Badge className="bg-green-900/20 text-green-500 border-green-800 px-3 py-1">
                        <ShieldCheck className="w-4 h-4 mr-2" /> Admin Access Granted
                    </Badge>
                )}
            </div>

            {/* Contract Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-4 bg-[#100F14] rounded-lg border border-gray-800/50">
                    <p className="font-semibold text-gray-500 mb-1">Contract Address</p>
                    <p className="font-mono text-white break-all">{bond.contractAddress || "Not Deployed"}</p>
                </div>
                <div className="p-4 bg-[#100F14] rounded-lg border border-gray-800/50">
                    <p className="font-semibold text-gray-500 mb-1">Treasury Address</p>
                    <p className="font-mono text-white break-all">{bond.treasuryAddress || "Not Configured"}</p>
                </div>
                <div className="p-4 bg-[#100F14] rounded-lg border border-gray-800/50">
                    <p className="font-semibold text-gray-500 mb-1">Distributor Address</p>
                    <p className="font-mono text-white break-all">{bond.distributorAddress || "Not Configured"}</p>
                </div>
            </div>

            {/* Vault Controls */}
            {isOwner ? (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    <div className="mb-6 flex items-center gap-4">
                        <div className="h-px bg-gray-800 flex-1" />
                        <span className="text-xs uppercase font-semibold tracking-wider text-[#FD8C00]">
                            Bond Vault Controls
                        </span>
                        <div className="h-px bg-gray-800 flex-1" />
                    </div>

                    {/* Pass specific bond address to controls */}
                    <VaultControls
                        enabled={true}
                        bondAddress={bond.contractAddress}
                        distributorAddress={bond.distributorAddress}
                    />

                    {/* Treasury Management */}
                    <div className="mt-8">
                        <div className="mb-6 flex items-center gap-4">
                            <div className="h-px bg-gray-800 flex-1" />
                            <span className="text-xs uppercase font-semibold tracking-wider text-green-500">
                                Treasury & Reserves
                            </span>
                            <div className="h-px bg-gray-800 flex-1" />
                        </div>
                        {bond.treasuryAddress ? (
                            <TreasuryWithdraw
                                treasuryAddress={bond.treasuryAddress}
                                bondSymbol={bond.bondName}
                            />
                        ) : (
                            <div className="text-center text-gray-500 py-4">No Treasury Configured</div>
                        )}
                    </div>
                </section>
            ) : (
                <div className="p-8 border border-red-900/50 bg-red-900/10 rounded-lg text-center">
                    <h3 className="text-red-500 font-bold mb-2">Unauthorized</h3>
                    <p className="text-gray-400">You do not have permission to manage this bond's vault.</p>
                </div>
            )}
        </div>
    )
}
