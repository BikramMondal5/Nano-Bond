import { useAccount, useReadContract } from 'wagmi'
import { SOVEREIGN_BOND, COUPON_DISTRIBUTOR, TREASURY_SWAP } from '@/lib/contracts'
import { formatUnits } from 'viem'

export function usePortfolioData() {
    const { address } = useAccount()

    // 1. Get GBOND Balance
    const { data: balance, isLoading: loadingBalance, refetch: refetchBalance } = useReadContract({
        address: SOVEREIGN_BOND.address,
        abi: SOVEREIGN_BOND.abi,
        functionName: 'balanceOf',
        args: [address!],
        query: {
            enabled: !!address
        }
    })

    // 2. Get Distribution Data (Cumulative Yield)
    const { data: cumulativeYield, refetch: refetchYield } = useReadContract({
        address: COUPON_DISTRIBUTOR.address,
        abi: COUPON_DISTRIBUTOR.abi,
        functionName: 'cumulativeYieldPerToken',
    })

    // 3. Get User's Paid Per Token
    const { data: userPaid, refetch: refetchPaid } = useReadContract({
        address: COUPON_DISTRIBUTOR.address,
        abi: COUPON_DISTRIBUTOR.abi,
        functionName: 'userPaidPerToken',
        args: [address!],
        query: {
            enabled: !!address
        }
    })

    // Calculation: Claimable = Balance * (Cumulative - UserPaid)
    // All units in 1e18? Or 1e6?
    // Usually Yield Rate is high precision (1e18).

    let claimable = "0"
    if (balance && cumulativeYield !== undefined && userPaid !== undefined) {
        const bal = BigInt(balance as bigint)
        const cum = BigInt(cumulativeYield as bigint)
        const paid = BigInt(userPaid as bigint)

        console.log("DEBUG: Portfolio Data", {
            balance: formatUnits(bal, 6), // showing as 6 decimals for readability
            cumulativeYield: cum.toString(),
            userPaid: paid.toString(),
            diff: (cum - paid).toString()
        })

        // FIX: If userPaid is 0 but cumulativeYield is > 0, we can't legitimately claim ALL history. 
        // This usually happens on first load or uninitialized state.
        // We will default to 0 yield in this specific edge case.
        if (paid === 0n && cum > 0n) {
            claimable = "0"
        } else {
            const diff = cum - paid
            const rawClaimable = (bal * diff) / BigInt(1e18) // Normalizing rate
            claimable = formatUnits(rawClaimable, 6) // USDT has 6 decimals
        }
    }

    // 4. Verify TreasurySwap Linkage (Debug)
    // We can't read 'bond()' from Treasury (older version?).
    // Check if Treasury has MINTER_ROLE on SovereignBond instead.

    // MINTER_ROLE = keccak256("MINTER_ROLE")
    // Pre-computed: 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
    const MINTER_ROLE = "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"

    const { data: hasMinterRole, isLoading: loadingRole } = useReadContract({
        address: SOVEREIGN_BOND.address,
        abi: SOVEREIGN_BOND.abi,
        functionName: 'hasRole',
        args: [MINTER_ROLE, TREASURY_SWAP.address]
    })

    const refetch = () => {
        console.log("DEBUG: Refreshing Data...", {
            address,
            bond: SOVEREIGN_BOND.address,
            treasury: TREASURY_SWAP.address,
            hasMinterRole,
            balance
        })

        if (hasMinterRole === false) {
            console.error("CRITICAL CONFIG ERROR: TreasurySwap does NOT have MINTER_ROLE on the Bond contract.")
        }
        refetchBalance()
        refetchYield()
        refetchPaid()
    }

    return {
        // Since TreasurySwap now correctly mints 18-decimal Bonds (scaled up),
        // we must parse the balance as 18 decimals.
        balance: balance ? formatUnits(balance as bigint, 18) : "0",
        claimable,
        isLoading: loadingBalance,
        address,
        refetch
    }
}
