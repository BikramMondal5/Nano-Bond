import { useWriteContract, useReadContract, useAccount } from 'wagmi'
import { TREASURY_SWAP, USDT } from '@/lib/contracts'
import { parseUnits, formatUnits } from 'viem'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

export function useInvestment() {
  const { address } = useAccount()
  const {
    writeContract: writeApprove,
    isPending: isApprovePending,
    data: approveHash
  } = useWriteContract()

  const {
    writeContract: writeBuy,
    isPending: isBuyPending,
    data: buyHash,
    error: buyError
  } = useWriteContract()

  // Approve USDT for TreasurySwap
  const approve = async (amount: string) => {
    try {
      writeApprove({
        address: USDT.address,
        abi: USDT.abi,
        functionName: 'approve',
        args: [TREASURY_SWAP.address, parseUnits(amount, 6)]
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to approve USDT')
    }
  }

  // Buy Bond
  const buy = async (amount: string) => {
    try {
      writeBuy({
        address: TREASURY_SWAP.address,
        abi: TREASURY_SWAP.abi,
        functionName: 'buy',
        args: [parseUnits(amount, 6)]
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to buy proof')
    }
  }

  // Check Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDT.address,
    abi: USDT.abi,
    functionName: 'allowance',
    args: [address!, TREASURY_SWAP.address],
    query: {
      enabled: !!address,
      // Refetch allowance when approve tx is done or periodically
      refetchInterval: isApprovePending ? 1000 : 5000
    }
  })

  // Helper to speed up UI feeling of "approved"
  // If approveHash exists, we might want to wait, 
  // but allowance polling will eventually catch up.

  // Get USDT Balance
  const { data: rawBalance } = useReadContract({
    address: USDT.address,
    abi: USDT.abi,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address,
      refetchInterval: 5000
    }
  })

  // Format as 6 decimals
  const usdtBalance = rawBalance ? formatUnits(rawBalance as bigint, 6) : "0"

  return {
    approve,
    buy,
    allowance: allowance ? allowance : BigInt(0),
    refetchAllowance,
    isApprovePending,
    approveHash,
    isBuyPending,
    buyHash,
    buyError,
    usdtBalance
  }
}
