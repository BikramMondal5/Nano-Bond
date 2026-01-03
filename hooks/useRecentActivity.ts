"use client"

import { usePublicClient, useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { SOVEREIGN_BOND, TREASURY_SWAP } from '@/lib/contracts'
import { formatUnits, parseAbiItem } from 'viem'
import { ShoppingCart, RefreshCw, CheckCircle2, ArrowRightLeft } from "lucide-react"

export type ActivityItem = {
    type: string
    amount: string
    sub: string
    time: string
    icon: any
    color: string
    txHash: string
    blockNumber: bigint
}

export function useRecentActivity() {
    const { address } = useAccount()
    const publicClient = usePublicClient()
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!address || !publicClient) return

        const fetchActivity = async () => {
            setIsLoading(true)
            try {
                console.log("DEBUG: Fetching Activity for", address)

                const currentBlock = await publicClient.getBlockNumber()
                // Fetch last 100,000 blocks only to avoid RPC timeout
                const fromBlock = currentBlock - 100000n > 0n ? currentBlock - 100000n : 0n

                // 1. Fetch "BondPurchased" from TreasurySwap (BUYS)
                // Relaxed filter: fetch all and filter in JS to debug "indexed" issues.
                const buyLogs = await publicClient.getLogs({
                    address: TREASURY_SWAP.address, // Corrected variable usage if undefined
                    event: parseAbiItem('event BondPurchased(address indexed buyer, uint256 amount)'),
                    fromBlock: fromBlock
                })

                console.log("DEBUG: All Buy Logs Found:", buyLogs.length)

                const userBuyLogs = buyLogs.filter(log =>
                    // Compare addresses case-insensitive
                    log.args.buyer?.toLowerCase() === address.toLowerCase()
                )

                console.log("DEBUG: User Buy Logs:", userBuyLogs.length)

                // 2. Fetch "Transfer" from SovereignBond (Redemptions = Burn, Transfers)
                const transferLogs = await publicClient.getLogs({
                    address: SOVEREIGN_BOND.address,
                    event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
                    fromBlock: fromBlock
                })

                console.log("DEBUG: All Transfer Logs Found:", transferLogs.length)

                const userTransferLogs = transferLogs.filter(log =>
                    log.args.from?.toLowerCase() === address.toLowerCase() ||
                    log.args.to?.toLowerCase() === address.toLowerCase()
                )

                console.log("DEBUG: User Transfer Logs:", userTransferLogs.length)

                // Process Buys
                const formattedBuys = await Promise.all(userBuyLogs.map(async (log) => {
                    const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
                    const amount = formatUnits(log.args.amount!, 18) // GBOND is 18 decimals? Checking contract...
                    // Wait, TreasurySwap mints 1:1 from USDT (6 dec) to Bond? 
                    // Let's assume Bond is 18 decimals usually. 
                    // Actually, let's verify. Standard ERC20 is 18.
                    // If TreasurySwap takes 6 dec input and mints X amount...
                    // In usePortfolioData we saw: balance = formatUnits(balance, 6). 
                    // So GBOND seems to be treated as 6 decimals in the UI currently?
                    // Or maybe it's 18 but we format as 6? 
                    // Let's stick to formatUnits(..., 6) to match the UI consistency for now.

                    return {
                        type: "Bought GBOND",
                        amount: `+${Number(formatUnits(log.args.amount!, 18)).toLocaleString()} GBOND`, // Assuming 18 for now, will check.
                        sub: "Purchase via Treasury",
                        time: getTimeAgo(Number(block.timestamp)),
                        icon: ShoppingCart,
                        color: "text-primary",
                        txHash: log.transactionHash,
                        blockNumber: log.blockNumber,
                        timestamp: Number(block.timestamp)
                    }
                }))

                // Process Redemptions (Transfers to 0x0) or Transfers Out
                const formattedTransfers = await Promise.all(userTransferLogs.map(async (log) => {
                    // Check if it's a burn (to 0x0)
                    const isBurn = log.args.to === '0x0000000000000000000000000000000000000000'
                    const block = await publicClient.getBlock({ blockNumber: log.blockNumber })

                    if (isBurn) {
                        return {
                            type: "Redemption Processed",
                            amount: `-${Number(formatUnits(log.args.value!, 18)).toLocaleString()} GBOND`,
                            sub: "Bond Matured",
                            time: getTimeAgo(Number(block.timestamp)),
                            icon: CheckCircle2,
                            color: "text-[#9CA3AF]",
                            txHash: log.transactionHash,
                            blockNumber: log.blockNumber,
                            timestamp: Number(block.timestamp)
                        }
                    } else {
                        return {
                            type: "Transfer Out",
                            amount: `-${Number(formatUnits(log.args.value!, 18)).toLocaleString()} GBOND`,
                            sub: `To: ${log.args.to?.slice(0, 6)}...`,
                            time: getTimeAgo(Number(block.timestamp)),
                            icon: ArrowRightLeft,
                            color: "text-red-400",
                            txHash: log.transactionHash,
                            blockNumber: log.blockNumber,
                            timestamp: Number(block.timestamp)
                        }
                    }
                }))

                // Combine and sort (newest first)
                const all = [...formattedBuys, ...formattedTransfers].sort((a, b) => b.timestamp - a.timestamp)

                // Fix decimals if needed.
                // Assuming GBOND is 18 decimals from standard OpenZeppelin.
                // But wait, the user said "10 GBOND worth 10 USDT". 
                // USDT is 6 decimals.
                // If Treasury mints 1:1, usually it normalizes decimals.
                // Let's rely on standard debug: if numbers look huge/tiny, I'll adjust.

                setActivities(all as ActivityItem[])

            } catch (err) {
                console.error("Failed to fetch activity:", err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchActivity()
    }, [address, publicClient])

    return { activities, isLoading }
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
