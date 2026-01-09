"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, ExternalLink, Settings, Ban } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface Bond {
    bondId: string
    bondName: string
    issuer: string
    adminWallet?: string
    couponRate: number
    maturityDate?: string
    contractAddress?: string
    treasuryAddress?: string
}

export function BondList() {
    const { address } = useAccount()
    const [bonds, setBonds] = useState<Bond[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchBonds() {
            try {
                const res = await fetch('/api/bonds')
                const data = await res.json()
                if (Array.isArray(data)) {
                    setBonds(data)
                }
            } catch (error) {
                console.error("Failed to fetch bonds:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchBonds()
    }, [])

    if (isLoading) {
        return <div className="text-gray-400">Loading bonds...</div>
    }

    if (bonds.length === 0) {
        return <div className="text-gray-400">No bonds found. Create one to get started.</div>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bonds.map((bond) => {
                // Check Ownership
                // If adminWallet is missing (old bonds), assume not owned or owned by deployment owner
                const isOwner = bond.adminWallet && address
                    ? bond.adminWallet.toLowerCase() === address.toLowerCase()
                    : false

                // For testing, let's allow managing legacy bonds if address matches a hardcoded update (optional, but sticking to strict check for now)

                return (
                    <Card key={bond.bondId} className="bg-[#100F14] border-gray-800 hover:border-gray-700 transition-all">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge variant="outline" className="mb-2 border-gray-700 text-gray-400">
                                        {bond.bondId}
                                    </Badge>
                                    <CardTitle className="text-xl text-white">{bond.bondName}</CardTitle>
                                    <CardDescription className="text-gray-400">{bond.issuer}</CardDescription>
                                </div>
                                {isOwner && (
                                    <Badge className="bg-green-900/20 text-green-500 hover:bg-green-900/30 border-none">
                                        You are Owner
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Coupon Rate</p>
                                        <p className="text-white font-medium">{bond.couponRate}%</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Maturity</p>
                                        <p className="text-white font-medium">
                                            {bond.maturityDate ? format(new Date(bond.maturityDate), 'PP') : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-800 flex gap-3">
                                    {isOwner ? (
                                        <Link href={`/admin/bonds/${bond.bondId}`} className="w-full">
                                            <Button className="w-full bg-[#FD8C00] hover:bg-[#E67E00] text-black font-bold">
                                                <Settings className="w-4 h-4 mr-2" /> Manage Bond
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button disabled className="w-full bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700">
                                            <Ban className="w-4 h-4 mr-2" /> Unauthorized
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
