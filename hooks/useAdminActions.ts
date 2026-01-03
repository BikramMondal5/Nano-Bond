import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { SOVEREIGN_BOND, COUPON_DISTRIBUTOR, USDT } from '@/lib/contracts'
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
                args: [uri, parseUnits(value, 6)], // Assuming 6 decimals for value if USDT-like backing, or 18? SovereignBond usually reflects backed money so maybe 18. Let's assume 18.
                // Wait, USDT is 6. If value is pure number, assume 18 for standard. 
                // Let's use 18 for now or check ERC20 decimals.
            })
        } catch (err) {
            console.error(err)
            toast.error('Failed to initiate transaction')
        }
    }

    // Helper to distribute yield
    const distributeYield = async (amount: string) => {
        try {
            write({
                address: COUPON_DISTRIBUTOR.address,
                abi: COUPON_DISTRIBUTOR.abi,
                functionName: 'depositYield',
                args: [parseUnits(amount, 6)], // Yield is likely USDT, so 6 decimals
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

    return {
        addAsset,
        distributeYield,
        approveUSDT,
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
    })

    const { data: backedValue } = useReadContract({
        address: SOVEREIGN_BOND.address,
        abi: SOVEREIGN_BOND.abi,
        functionName: 'totalBackedValue',
    })

    return {
        totalSupply,
        backedValue
    }
}
