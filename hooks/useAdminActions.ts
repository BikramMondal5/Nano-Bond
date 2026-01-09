import { useState } from 'react'
import { ethers } from 'ethers'
import { SOVEREIGN_BOND, COUPON_DISTRIBUTOR, USDT, TREASURY_SWAP } from '@/lib/contracts'
import { toast } from 'sonner'
import { useWalletClient, useAccount } from 'wagmi'
import { clientToSigner } from '@/lib/wagmi-ethers-adapters'

export * from './useStats'

export function useAdminActions(bondAddress?: string, distributorAddress?: string) {
    const { data: walletClient } = useWalletClient()
    const { isConnected } = useAccount()

    const [hash, setHash] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [writeError, setWriteError] = useState<Error | null>(null)

    // Fallback to defaults
    const BOND_ADDR = bondAddress || SOVEREIGN_BOND.address
    const DIST_ADDR = distributorAddress || COUPON_DISTRIBUTOR.address

    const getSigner = async () => {
        if (!walletClient) throw new Error('Wallet not connected')
        return clientToSigner(walletClient)
    }

    // Helper to add asset (Bond Proof)
    const addAsset = async (uri: string, value: string) => {
        try {
            if (!isConnected) throw new Error('Please connect your admin wallet')
            setIsPending(true)
            setWriteError(null)

            const signer = await getSigner()
            const bond = new ethers.Contract(BOND_ADDR, SOVEREIGN_BOND.abi, signer)
            const valueBig = ethers.parseUnits(value, 18)

            const tx = await bond.addAsset(uri, valueBig)
            setHash(tx.hash)
            await tx.wait()
            toast.success('Asset added successfully!')
        } catch (err: any) {
            console.error(err)
            setWriteError(err)
            toast.error('Failed to add asset: ' + err.message)
        } finally {
            setIsPending(false)
        }
    }

    // Helper to fund reserve (No distribution)
    const fundReserve = async (amount: string) => {
        try {
            if (!isConnected) throw new Error('Please connect your admin wallet')
            setIsPending(true)
            const signer = await getSigner()

            const distributor = new ethers.Contract(DIST_ADDR, COUPON_DISTRIBUTOR.abi, signer)
            const amountBig = ethers.parseUnits(amount, 6)

            const tx = await distributor.fundReserve(amountBig)
            setHash(tx.hash)
            await tx.wait()
            toast.success('Reserve funded successfully!')
        } catch (err: any) {
            console.error(err)
            toast.error('Failed to fund reserve: ' + err.message)
        } finally {
            setIsPending(false)
        }
    }

    // Helper to distribute yield BY RATE
    const distributeRate = async (rate: string) => {
        try {
            if (!isConnected) throw new Error('Please connect your admin wallet')
            setIsPending(true)
            const signer = await getSigner()

            const distributor = new ethers.Contract(DIST_ADDR, COUPON_DISTRIBUTOR.abi, signer)
            const rateBig = ethers.parseUnits(rate, 6)

            const tx = await distributor.distribute(rateBig)
            setHash(tx.hash)
            await tx.wait()
            toast.success('Yield distributed successfully!')
        } catch (err: any) {
            console.error(err)
            toast.error('Failed to distribute rate: ' + err.message)
        } finally {
            setIsPending(false)
        }
    }

    // Legacy Support
    const distributeYield = async (amount: string) => {
        try {
            if (!isConnected) throw new Error('Please connect your admin wallet')
            setIsPending(true)
            const signer = await getSigner()

            const distributor = new ethers.Contract(DIST_ADDR, COUPON_DISTRIBUTOR.abi, signer)
            const amountBig = ethers.parseUnits(amount, 6)

            const tx = await distributor.depositYield(amountBig)
            setHash(tx.hash)
            await tx.wait()
            toast.success('Yield deposited successfully!')
        } catch (err: any) {
            console.error(err)
            toast.error('Failed to deposit yield: ' + err.message)
        } finally {
            setIsPending(false)
        }
    }

    // Helper to approve USDT
    const approveUSDT = async (amount: string) => {
        try {
            if (!isConnected) throw new Error('Please connect your admin wallet')
            setIsPending(true)
            const signer = await getSigner()

            const usdt = new ethers.Contract(USDT.address, USDT.abi, signer)
            const amountBig = ethers.parseUnits(amount, 6)

            const tx = await usdt.approve(DIST_ADDR, amountBig)
            setHash(tx.hash)
            await tx.wait()
            toast.success('USDT approved successfully!')
        } catch (err: any) {
            console.error(err)
            toast.error('Failed to approve USDT: ' + err.message)
        } finally {
            setIsPending(false)
        }
    }

    // Helper to set maturity date
    const setMaturityDate = async (timestamp: number) => {
        try {
            if (!isConnected) throw new Error('Please connect your admin wallet')
            setIsPending(true)
            const signer = await getSigner()

            const bond = new ethers.Contract(BOND_ADDR, SOVEREIGN_BOND.abi, signer)

            const tx = await bond.setMaturityDate(BigInt(timestamp))
            setHash(tx.hash)
            await tx.wait()
            toast.success('Maturity date set successfully!')
        } catch (err: any) {
            console.error(err)
            toast.error('Failed to set maturity date: ' + err.message)
        } finally {
            setIsPending(false)
        }
    }

    return {
        addAsset,
        distributeYield,
        fundReserve,
        distributeRate,
        approveUSDT,
        setMaturityDate,
        hash,
        isPending,
        writeError
    }
}

// ADMIN-SPECIFIC STATS HOOKS (Use Wagmi Provider)
import { useEthersProvider } from '@/lib/wagmi-ethers-adapters'
import { useCallback, useEffect } from 'react'

export function useAdminBondStats(bondAddr?: string) {
    const provider = useEthersProvider()
    const ADDR = bondAddr || SOVEREIGN_BOND.address

    const [totalSupply, setTotalSupply] = useState<bigint | null>(null)
    const [backedValue, setBackedValue] = useState<bigint | null>(null)
    const [maturityDate, setMaturityDate] = useState<bigint | null>(null)

    const fetchStats = useCallback(async () => {
        try {
            if (!provider) return

            const bond = new ethers.Contract(ADDR, SOVEREIGN_BOND.abi, provider)

            const [supply, backed, maturity] = await Promise.all([
                bond.totalSupply(),
                bond.totalBackedValue(),
                bond.maturityDate()
            ])

            setTotalSupply(supply)
            setBackedValue(backed)
            setMaturityDate(maturity)
        } catch (error) {
            console.error('Failed to fetch admin bond stats:', error)
        }
    }, [provider, ADDR])

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 5000)
        return () => clearInterval(interval)
    }, [fetchStats])

    return {
        totalSupply,
        backedValue,
        maturityDate,
        refetch: fetchStats
    }
}

export function useAdminTreasuryStats(treasuryAddr?: string) {
    const provider = useEthersProvider()
    const ADDR = treasuryAddr || TREASURY_SWAP.address

    const [usdtBalance, setUsdtBalance] = useState<bigint | null>(null)

    const fetchStats = useCallback(async () => {
        try {
            if (!provider) return

            const usdt = new ethers.Contract(USDT.address, USDT.abi, provider)
            const balance = await usdt.balanceOf(ADDR)
            setUsdtBalance(balance)
        } catch (error) {
            console.error('Failed to fetch admin treasury stats:', error)
        }
    }, [provider, ADDR])

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 5000)
        return () => clearInterval(interval)
    }, [fetchStats])

    return {
        usdtBalance,
        refetch: fetchStats
    }
}

export function useAdminDistributorStats(distributorAddr?: string) {
    const provider = useEthersProvider()
    const ADDR = distributorAddr || COUPON_DISTRIBUTOR.address

    const [distributorBalance, setDistributorBalance] = useState<bigint | null>(null)
    const [cumulativeYield, setCumulativeYield] = useState<bigint | null>(null)

    const fetchStats = useCallback(async () => {
        try {
            if (!provider) return

            const usdt = new ethers.Contract(USDT.address, USDT.abi, provider)
            const distributor = new ethers.Contract(ADDR, COUPON_DISTRIBUTOR.abi, provider)

            const [balance, cumYield] = await Promise.all([
                usdt.balanceOf(ADDR),
                distributor.cumulativeYieldPerToken()
            ])

            setDistributorBalance(balance)
            setCumulativeYield(cumYield)
        } catch (error) {
            console.error('Failed to fetch admin distributor stats:', error)
        }
    }, [provider, ADDR])

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 5000)
        return () => clearInterval(interval)
    }, [fetchStats])

    return {
        distributorBalance,
        cumulativeYield,
        refetch: fetchStats
    }
}
