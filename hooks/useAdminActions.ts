import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { SOVEREIGN_BOND, COUPON_DISTRIBUTOR, USDT, TREASURY_SWAP } from '@/lib/contracts'
import { toast } from 'sonner'
import { parseUnits } from 'viem'

export function useAdminActions() {
    const {
        writeContract: write,
        data: hash,
        isPending,
        error: writeError
    } = useWriteContract()

    // Helper to add asset (Bond Proof)
    const addAsset = async (uri: string, value: string) => {
        try {
            write({
                address: SOVEREIGN_BOND.address,
                abi: SOVEREIGN_BOND.abi,
                functionName: 'addAsset',
                args: [uri, parseUnits(value, 18)], // SovereignBond backing must match Minting decimals (18)
                // Note: Even if backing asset is USDT (6 decimals), we record its VALUE in standard units (18)
                // to allow 1:1 minting of 18-decimal GBONDs.
            })
        } catch (err) {
            console.error(err)
            toast.error('Failed to initiate transaction')
        }
    }

    // Helper to fund reserve (No distribution)
    const fundReserve = async (amount: string) => {
        try {
            write({
                address: COUPON_DISTRIBUTOR.address,
                abi: COUPON_DISTRIBUTOR.abi,
                functionName: 'fundReserve',
                args: [parseUnits(amount, 6)], // Reserve in USDT (6 decimals)
            })
        } catch (err) {
            console.error(err)
            toast.error('Failed to fund reserve')
        }
    }

    // Helper to distribute yield BY RATE (e.g. 0.08 per token)
    const distributeRate = async (rate: string) => {
        try {
            write({
                address: COUPON_DISTRIBUTOR.address,
                abi: COUPON_DISTRIBUTOR.abi,
                functionName: 'distribute',
                args: [parseUnits(rate, 6)], // Rate is "USDT per Token". If Token is 18 dec, and USDT is 6 dec. 
                // Logic in contract: Cost = Supply * Rate / 1e18.
                // If we want 1 USDT per token, Rate should be 1e6.
            })
        } catch (err) {
            console.error(err)
            toast.error('Failed to distribute rate')
        }
    }

    // Legacy Support (Optional)
    const distributeYield = async (amount: string) => {
        try {
            write({
                address: COUPON_DISTRIBUTOR.address,
                abi: COUPON_DISTRIBUTOR.abi,
                functionName: 'depositYield',
                args: [parseUnits(amount, 6)],
            })
        } catch (err) {
            console.error(err)
            toast.error('Failed to initiate yield distribution')
        }
    }

    // Helper to approve USDT
    const approveUSDT = async (amount: string) => {
        try {
            write({
                address: USDT.address,
                abi: USDT.abi,
                functionName: 'approve',
                args: [COUPON_DISTRIBUTOR.address, parseUnits(amount, 6)]
            })
        } catch (err) {
            console.error(err)
            toast.error('Failed to approve USDT')
        }
    }

    // Helper to set maturity date
    const setMaturityDate = async (timestamp: number) => {
        try {
            write({
                address: SOVEREIGN_BOND.address,
                abi: SOVEREIGN_BOND.abi,
                functionName: 'setMaturityDate',
                args: [BigInt(timestamp)]
            })
        } catch (err) {
            console.error(err)
            toast.error('Failed to set maturity date')
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

export function useBondStats() {
    const { data: totalSupply } = useReadContract({
        address: SOVEREIGN_BOND.address,
        abi: SOVEREIGN_BOND.abi,
        functionName: 'totalSupply',
        query: {
            refetchInterval: 2000
        }
    })

    const { data: backedValue } = useReadContract({
        address: SOVEREIGN_BOND.address,
        abi: SOVEREIGN_BOND.abi,
        functionName: 'totalBackedValue',
        query: {
            refetchInterval: 2000
        }
    })

    const { data: maturityDate } = useReadContract({
        address: SOVEREIGN_BOND.address,
        abi: SOVEREIGN_BOND.abi,
        functionName: 'maturityDate',
        query: {
            refetchInterval: 5000
        }
    })

    return {
        totalSupply,
        backedValue,
        maturityDate
    }
}
// ... existing exports ...

export function useTreasuryStats() {
    const { data: usdtBalance } = useReadContract({
        address: USDT.address,
        abi: USDT.abi,
        functionName: 'balanceOf',
        args: [TREASURY_SWAP.address], // TREASURY_SWAP is imported
        query: {
            refetchInterval: 2000
        }
    })

    return {
        usdtBalance
    }
}

export function useDistributorStats() {
    // 1. Get Distributor USDT Balance (Tokens Left to be Claimed)
    const { data: distributorBalance } = useReadContract({
        address: USDT.address,
        abi: USDT.abi,
        functionName: 'balanceOf',
        args: [COUPON_DISTRIBUTOR.address],
        query: {
            refetchInterval: 5000
        }
    })

    // 2. Get Cumulative Yield Per Token (For Total Distributed calc)
    const { data: cumulativeYield } = useReadContract({
        address: COUPON_DISTRIBUTOR.address,
        abi: COUPON_DISTRIBUTOR.abi,
        functionName: 'cumulativeYieldPerToken',
        query: {
            refetchInterval: 5000
        }
    })

    return {
        distributorBalance,
        cumulativeYield
    }
}
