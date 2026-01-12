"use client"

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, ShoppingCart, ArrowRightLeft, Loader2, Receipt } from "lucide-react"
import { useWeb3AuthContext } from '@/components/providers'
import axios from 'axios'

export type ActivityItem = {
    type: string
    amount: string
    sub: string
    time: string
    icon: any
    color: string
    txHash: string
    blockNumber?: number
    timestamp?: number
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export function useRecentActivity() {
    const { walletAddress, loggedIn } = useWeb3AuthContext()
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchActivity = useCallback(async () => {
        if (!walletAddress || !loggedIn) {
            setActivities([])
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            console.log("DEBUG: Fetching Activity for", walletAddress)

            // Fetch from our new local API (which gets data from MongoDB)
            // Note: We use relative path for Next.js API routes
            const response = await axios.get(`/api/investments?address=${walletAddress}`)

            if (response.data.success) {
                const investments = response.data.data
                const formattedActivities: ActivityItem[] = investments.map((inv: any) => {
                    let type, amount, sub, icon, color

                    if (inv.type === 'INVEST') {
                        type = `Bought ${inv.bondId || 'GBOND'}`
                        amount = `+${inv.amount.toLocaleString()} GBOND`
                        sub = "Purchase via Treasury"
                        icon = ShoppingCart
                        color = "text-primary"
                    } else if (inv.type === 'REDEEM') {
                        type = `Redeemed ${inv.bondId || 'GBOND'}`
                        amount = `-${inv.amount.toLocaleString()} GBOND`
                        sub = "Bond Redemption"
                        icon = CheckCircle2
                        color = "text-[#9CA3AF]"
                    } else if (inv.type === 'CLAIM') {
                        type = `Claimed Yield`
                        amount = `+ Yield`
                        sub = `From ${inv.bondId || 'GBOND'}`
                        icon = Receipt
                        color = "text-green-500"
                    } else {
                        type = "Transaction"
                        amount = `${inv.amount}`
                        sub = inv.bondId
                        icon = ArrowRightLeft
                        color = "text-blue-500"
                    }

                    return {
                        type,
                        amount,
                        sub,
                        time: getTimeAgo(new Date(inv.timestamp).getTime() / 1000),
                        icon,
                        color,
                        txHash: inv.txHash,
                        timestamp: new Date(inv.timestamp).getTime()
                    }
                })

                setActivities(formattedActivities)
            }
        } catch (err) {
            console.error("Failed to fetch activity:", err)
        } finally {
            setIsLoading(false)
        }
    }, [walletAddress, loggedIn])

    useEffect(() => {
        fetchActivity()
    }, [fetchActivity])

    return { activities, isLoading, refetch: fetchActivity }
}

function getTimeAgo(timestamp: number) {
    const seconds = Math.floor(Date.now() / 1000) - timestamp
    if (seconds < 60) return "Just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} mins ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    return `${days} days ago`
}
