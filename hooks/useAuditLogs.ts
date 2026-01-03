import { usePublicClient } from 'wagmi'
import { useState, useEffect } from 'react'
import { SOVEREIGN_BOND, TREASURY_SWAP } from '@/lib/contracts'
import { formatUnits, parseAbiItem } from 'viem'

export type AuditLogItem = {
    timestamp: string
    admin: string // or "User" / Address
    action: string
    status: string
    bondId: string
    rawTimestamp: number
}

export function useAuditLogs() {
    const publicClient = usePublicClient()
    const [logs, setLogs] = useState<AuditLogItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!publicClient) return

        const fetchLogs = async () => {
            setIsLoading(true)
            try {
                const currentBlock = await publicClient.getBlockNumber()
                const fromBlock = currentBlock - 100000n > 0n ? currentBlock - 100000n : 0n

                // 1. Fetch BondPurchased (Investments)
                const buyLogs = await publicClient.getLogs({
                    address: TREASURY_SWAP.address,
                    event: parseAbiItem('event BondPurchased(address indexed buyer, uint256 amount)'),
                    fromBlock
                })

                // 2. Fetch Transfer (Mint/Burn/Transfer)
                const transferLogs = await publicClient.getLogs({
                    address: SOVEREIGN_BOND.address,
                    event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
                    fromBlock
                })

                const processedBuys = await Promise.all(buyLogs.map(async (log) => {
                    const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
                    return {
                        timestamp: new Date(Number(block.timestamp) * 1000).toLocaleString(),
                        admin: log.args.buyer || "Unknown",
                        action: `Purchased ${formatUnits(log.args.amount!, 18)} GBOND`, // Assuming 18 decimals
                        status: "Success",
                        bondId: "GBOND-001", // Static for now as we have 1 bond
                        rawTimestamp: Number(block.timestamp)
                    }
                }))

                const processedTransfers = await Promise.all(transferLogs.map(async (log) => {
                    const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
                    let action = "Transfer"
                    if (log.args.from === '0x0000000000000000000000000000000000000000') {
                        action = `Minted ${formatUnits(log.args.value!, 18)} GBOND`
                    } else if (log.args.to === '0x0000000000000000000000000000000000000000') {
                        action = `Burnt ${formatUnits(log.args.value!, 18)} GBOND`
                    } else {
                        action = `Transferred ${formatUnits(log.args.value!, 18)} GBOND`
                    }

                    return {
                        timestamp: new Date(Number(block.timestamp) * 1000).toLocaleString(),
                        admin: log.args.from === '0x0000000000000000000000000000000000000000' ? "Protocol (Mint)" : (log.args.from || "Unknown"),
                        action: action,
                        status: "Success",
                        bondId: "GBOND-001",
                        rawTimestamp: Number(block.timestamp)
                    }
                }))

                const allLogs = [...processedBuys, ...processedTransfers].sort((a, b) => b.rawTimestamp - a.rawTimestamp)
                setLogs(allLogs)

            } catch (err) {
                console.error("Error fetching audit logs:", err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchLogs()
        // Poll every 10 seconds? Or just once on mount. 
        // For dynamic "updates", interval is better.
        const interval = setInterval(fetchLogs, 10000)
        return () => clearInterval(interval)

    }, [publicClient])

    return { logs, isLoading }
}
