import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { SOVEREIGN_BOND, TREASURY_SWAP } from '@/lib/contracts'
import { useEthersProvider } from '@/lib/wagmi-ethers-adapters'

export type AuditLogItem = {
    timestamp: string
    admin: string
    action: string
    status: string
    bondId: string
    rawTimestamp: number
}

export function useAuditLogs() {
    // Use the Adapter provider (Wagmi/RainbowKit)
    const provider = useEthersProvider()

    const [logs, setLogs] = useState<AuditLogItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchLogs = useCallback(async () => {
        setIsLoading(true)
        try {
            if (!provider) {
                // Keep loading if provider not ready (or just return empty)
                setIsLoading(false)
                return
            }

            const currentBlock = await provider.getBlockNumber()
            // REDUCED RANGE: 5,000 blocks to prevent 413 Payload Too Large error
            const fromBlock = currentBlock - 5000 > 0 ? currentBlock - 5000 : 0

            const treasury = new ethers.Contract(TREASURY_SWAP.address, TREASURY_SWAP.abi, provider)
            const bond = new ethers.Contract(SOVEREIGN_BOND.address, SOVEREIGN_BOND.abi, provider)

            // Fetch BondPurchased events
            const buyFilter = treasury.filters.BondPurchased()
            const buyLogsRaw = await treasury.queryFilter(buyFilter, fromBlock)

            // Fetch Transfer events
            const transferFilter = bond.filters.Transfer()
            const transferLogsRaw = await bond.queryFilter(transferFilter, fromBlock)

            // OPTIMIZATION: Limit to last 20 logs to avoid Rate Limits (Concurrent getBlock calls)
            const buyLogs = buyLogsRaw.slice(-20)
            const transferLogs = transferLogsRaw.slice(-20)

            const processedBuys = await Promise.all(buyLogs.map(async (log: any) => {
                const block = await log.getBlock()
                const buyer = log.args?.[0] || "Unknown"
                const amount = log.args?.[1] || BigInt(0)

                return {
                    timestamp: new Date((block?.timestamp || 0) * 1000).toLocaleString(),
                    admin: buyer,
                    action: `Purchased ${ethers.formatUnits(amount, 18)} GBOND`,
                    status: "Success",
                    bondId: "GBOND-001",
                    rawTimestamp: block?.timestamp || 0
                }
            }))

            const processedTransfers = await Promise.all(transferLogs.map(async (log: any) => {
                const block = await log.getBlock()
                const from = log.args?.[0] || ""
                const to = log.args?.[1] || ""
                const value = log.args?.[2] || BigInt(0)

                let action = "Transfer"
                if (from === '0x0000000000000000000000000000000000000000') {
                    action = `Minted ${ethers.formatUnits(value, 18)} GBOND`
                } else if (to === '0x0000000000000000000000000000000000000000') {
                    action = `Burnt ${ethers.formatUnits(value, 18)} GBOND`
                } else {
                    action = `Transferred ${ethers.formatUnits(value, 18)} GBOND`
                }

                return {
                    timestamp: new Date((block?.timestamp || 0) * 1000).toLocaleString(),
                    admin: from === '0x0000000000000000000000000000000000000000' ? "Protocol (Mint)" : from,
                    action: action,
                    status: "Success",
                    bondId: "GBOND-001",
                    rawTimestamp: block?.timestamp || 0
                }
            }))

            const allLogs = [...processedBuys, ...processedTransfers].sort((a, b) => b.rawTimestamp - a.rawTimestamp)
            setLogs(allLogs)

        } catch (err) {
            console.error("Error fetching audit logs:", err)
        } finally {
            setIsLoading(false)
        }
    }, [provider])

    useEffect(() => {
        fetchLogs()
        const interval = setInterval(fetchLogs, 10000)
        return () => clearInterval(interval)
    }, [fetchLogs])

    return { logs, isLoading, refetch: fetchLogs }
}
