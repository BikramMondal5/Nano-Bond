"use client"

import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { SOVEREIGN_BOND, TREASURY_SWAP } from '@/lib/contracts'
import { ShoppingCart, RefreshCw, CheckCircle2, ArrowRightLeft } from "lucide-react"
import { useWeb3AuthContext } from '@/components/providers'

export type ActivityItem = {
    type: string
    amount: string
    sub: string
    time: string
    icon: any
    color: string
    txHash: string
    blockNumber: number
    timestamp?: number
}

export function useRecentActivity() {
    const { walletAddress, getEthersProvider, loggedIn } = useWeb3AuthContext()
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchActivity = useCallback(async () => {
        if (!walletAddress || !loggedIn) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        try {
            const provider = getEthersProvider()
            if (!provider) return

            console.log("DEBUG: Fetching Activity for", walletAddress)

            const currentBlock = await provider.getBlockNumber()
            const fromBlock = currentBlock - 100000 > 0 ? currentBlock - 100000 : 0

            const treasury = new ethers.Contract(TREASURY_SWAP.address, TREASURY_SWAP.abi, provider)
            const bond = new ethers.Contract(SOVEREIGN_BOND.address, SOVEREIGN_BOND.abi, provider)

            // Fetch BondPurchased events
            const buyFilter = treasury.filters.BondPurchased(walletAddress)
            const buyLogs = await treasury.queryFilter(buyFilter, fromBlock)

            console.log("DEBUG: User Buy Logs:", buyLogs.length)

            // Fetch Transfer events (both from and to user)
            const transferFromFilter = bond.filters.Transfer(walletAddress, null)
            const transferToFilter = bond.filters.Transfer(null, walletAddress)

            const [transferFromLogs, transferToLogs] = await Promise.all([
                bond.queryFilter(transferFromFilter, fromBlock),
                bond.queryFilter(transferToFilter, fromBlock)
            ])

            const transferLogs = [...transferFromLogs, ...transferToLogs]
            console.log("DEBUG: User Transfer Logs:", transferLogs.length)

            // Process Buys
            const formattedBuys = await Promise.all(buyLogs.map(async (log: any) => {
                const block = await log.getBlock()
                const amount = log.args?.[1] || BigInt(0)

                return {
                    type: "Bought GBOND",
                    amount: `+${Number(ethers.formatUnits(amount, 18)).toLocaleString()} GBOND`,
                    sub: "Purchase via Treasury",
                    time: getTimeAgo(block?.timestamp || 0),
                    icon: ShoppingCart,
                    color: "text-primary",
                    txHash: log.transactionHash,
                    blockNumber: log.blockNumber,
                    timestamp: block?.timestamp || 0
                }
            }))

            // Process Transfers
            const formattedTransfers = await Promise.all(transferLogs.map(async (log: any) => {
                const block = await log.getBlock()
                const to = log.args?.[1] || ''
                const value = log.args?.[2] || BigInt(0)

                const isBurn = to === '0x0000000000000000000000000000000000000000'

                if (isBurn) {
                    return {
                        type: "Redemption Processed",
                        amount: `-${Number(ethers.formatUnits(value, 18)).toLocaleString()} GBOND`,
                        sub: "Bond Matured",
                        time: getTimeAgo(block?.timestamp || 0),
                        icon: CheckCircle2,
                        color: "text-[#9CA3AF]",
                        txHash: log.transactionHash,
                        blockNumber: log.blockNumber,
                        timestamp: block?.timestamp || 0
                    }
                } else {
                    return {
                        type: "Transfer Out",
                        amount: `-${Number(ethers.formatUnits(value, 18)).toLocaleString()} GBOND`,
                        sub: `To: ${String(to).slice(0, 6)}...`,
                        time: getTimeAgo(block?.timestamp || 0),
                        icon: ArrowRightLeft,
                        color: "text-red-400",
                        txHash: log.transactionHash,
                        blockNumber: log.blockNumber,
                        timestamp: block?.timestamp || 0
                    }
                }
            }))

            // Combine and sort (newest first)
            const all = [...formattedBuys, ...formattedTransfers].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            setActivities(all as ActivityItem[])

        } catch (err) {
            console.error("Failed to fetch activity:", err)
        } finally {
            setIsLoading(false)
        }
    }, [walletAddress, loggedIn, getEthersProvider])

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
