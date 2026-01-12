import { useState, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import { SOVEREIGN_BOND, COUPON_DISTRIBUTOR, USDT, TREASURY_SWAP } from '@/lib/contracts'
import { useWeb3AuthContext } from '@/components/providers'

export function useBondStats(bondAddress?: string) {
    const { getEthersProvider, loggedIn } = useWeb3AuthContext()

    const [totalSupply, setTotalSupply] = useState<bigint | null>(null)
    const [backedValue, setBackedValue] = useState<bigint | null>(null)
    const [maturityDate, setMaturityDate] = useState<bigint | null>(null)

    const fetchStats = useCallback(async () => {
        try {
            const provider = getEthersProvider()
            if (!provider) return

            const addr = bondAddress || SOVEREIGN_BOND.address
            const bond = new ethers.Contract(addr, SOVEREIGN_BOND.abi, provider)

            const [supply, backed, maturity] = await Promise.all([
                bond.totalSupply(),
                bond.totalBackedValue(),
                bond.maturityDate()
            ])

            setTotalSupply(supply)
            setBackedValue(backed)
            setMaturityDate(maturity)
        } catch (error) {
            console.error('Failed to fetch bond stats:', error)
        }
    }, [getEthersProvider, bondAddress])

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 5000)
        return () => clearInterval(interval)
    }, [fetchStats, loggedIn])

    return {
        totalSupply,
        backedValue,
        maturityDate,
        refetch: fetchStats
    }
}

export function useTreasuryStats() {
    const { getEthersProvider, loggedIn } = useWeb3AuthContext()

    const [usdtBalance, setUsdtBalance] = useState<bigint | null>(null)

    const fetchStats = useCallback(async () => {
        try {
            const provider = getEthersProvider()
            if (!provider) return

            const usdt = new ethers.Contract(USDT.address, USDT.abi, provider)
            const balance = await usdt.balanceOf(TREASURY_SWAP.address)
            setUsdtBalance(balance)
        } catch (error) {
            console.error('Failed to fetch treasury stats:', error)
        }
    }, [getEthersProvider])

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 5000)
        return () => clearInterval(interval)
    }, [fetchStats, loggedIn])

    return {
        usdtBalance,
        refetch: fetchStats
    }
}

export function useDistributorStats() {
    const { getEthersProvider, loggedIn } = useWeb3AuthContext()

    const [distributorBalance, setDistributorBalance] = useState<bigint | null>(null)
    const [cumulativeYield, setCumulativeYield] = useState<bigint | null>(null)

    const fetchStats = useCallback(async () => {
        try {
            const provider = getEthersProvider()
            if (!provider) return

            const usdt = new ethers.Contract(USDT.address, USDT.abi, provider)
            const distributor = new ethers.Contract(COUPON_DISTRIBUTOR.address, COUPON_DISTRIBUTOR.abi, provider)

            const [balance, cumYield] = await Promise.all([
                usdt.balanceOf(COUPON_DISTRIBUTOR.address),
                distributor.cumulativeYieldPerToken()
            ])

            setDistributorBalance(balance)
            setCumulativeYield(cumYield)
        } catch (error) {
            console.error('Failed to fetch distributor stats:', error)
        }
    }, [getEthersProvider])

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 5000)
        return () => clearInterval(interval)
    }, [fetchStats, loggedIn])

    return {
        distributorBalance,
        cumulativeYield,
        refetch: fetchStats
    }
}
