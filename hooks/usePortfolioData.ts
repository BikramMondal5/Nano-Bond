import { useState, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import { SOVEREIGN_BOND, COUPON_DISTRIBUTOR, TREASURY_SWAP } from '@/lib/contracts'
import { useWeb3AuthContext } from '@/components/providers'

export function usePortfolioData(bondAddress?: string, distributorAddress?: string) {
    const { walletAddress, getEthersProvider, loggedIn } = useWeb3AuthContext()

    const [balance, setBalance] = useState<string>("0")
    const [claimable, setClaimable] = useState<string>("0")
    const [hasMinterRole, setHasMinterRole] = useState<boolean | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // MINTER_ROLE = keccak256("MINTER_ROLE")
    const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"

    const fetchData = useCallback(async () => {
        if (!walletAddress || !loggedIn) {
            setIsLoading(false)
            return
        }

        try {
            setIsLoading(true)
            const provider = getEthersProvider()
            if (!provider) return

            const bondAddr = bondAddress || SOVEREIGN_BOND.address
            const distAddr = distributorAddress || COUPON_DISTRIBUTOR.address
            const bond = new ethers.Contract(bondAddr, SOVEREIGN_BOND.abi, provider)
            const distributor = new ethers.Contract(distAddr, COUPON_DISTRIBUTOR.abi, provider)

            const [balanceRaw, claimableRaw, hasRole] = await Promise.all([
                bond.balanceOf(walletAddress),
                distributor.claimableYield(walletAddress),
                bond.hasRole(MINTER_ROLE, TREASURY_SWAP.address)
            ])

            setBalance(ethers.formatUnits(balanceRaw, 18))
            setClaimable(ethers.formatUnits(claimableRaw, 6))
            setHasMinterRole(hasRole)
        } catch (error) {
            console.error('Failed to fetch portfolio data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [walletAddress, loggedIn, getEthersProvider, bondAddress, distributorAddress])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const refetch = () => {
        console.log("DEBUG: Refreshing Data...", {
            address: walletAddress,
            bond: SOVEREIGN_BOND.address,
            treasury: TREASURY_SWAP.address,
            hasMinterRole,
            balance
        })

        if (hasMinterRole === false) {
            console.error("CRITICAL CONFIG ERROR: TreasurySwap does NOT have MINTER_ROLE on the Bond contract.")
        }
        fetchData()
    }

    return {
        balance,
        claimable,
        isLoading,
        address: walletAddress,
        refetch
    }
}
