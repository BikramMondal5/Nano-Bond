import { useWriteContract, useReadContract, useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { TREASURY_SWAP, USDT, COUPON_DISTRIBUTOR } from '@/lib/contracts'
import { parseUnits, formatUnits } from 'viem'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

export function useInvestment() {
  const { address } = useAccount()

  // 1. Data Fetching (Read Hooks)
  // Check Allowance (Safe to define early)
  const { data: allowance, refetch: refetchAllowance, error: allowanceError } = useReadContract({
    address: USDT.address,
    abi: USDT.abi,
    functionName: 'allowance',
    args: [address!, TREASURY_SWAP.address],
    query: {
      enabled: !!address,
      refetchInterval: 2000
    }
  })

  // Get USDT Balance
  const { data: rawBalance, refetch: refetchBalance } = useReadContract({
    address: USDT.address,
    abi: USDT.abi,
    functionName: 'balanceOf',
    args: [address!],
    query: {
      enabled: !!address,
      refetchInterval: 5000
    }
  })

  // 2. Mutations (Write Hooks)
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

  // 3. Side Effects (Wait for Receipts)
  // Wait for Approve TX
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    })

  // Refetch allowance when confirmed
  useEffect(() => {
    if (isApproveConfirmed) {
      refetchAllowance()
      toast.success('USDT Approved successfully!')
    }
  }, [isApproveConfirmed, refetchAllowance])

  // Watch for Buy Success to refetch balance
  const { isSuccess: isBuyConfirmed } = useWaitForTransactionReceipt({ hash: buyHash })

  useEffect(() => {
    if (isBuyConfirmed) {
      refetchBalance()
      toast.success('Bond purchased successfully!')
    }
  }, [isBuyConfirmed, refetchBalance])

  // 4. Action Functions
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
      toast.error('Failed to buy bond')
    }
  }

  // Redeem Bond
  const redeem = async (amount: string) => {
    try {
      writeBuy({
        address: TREASURY_SWAP.address,
        abi: TREASURY_SWAP.abi,
        functionName: 'redeem',
        args: [parseUnits(amount, 18)] // Redeem amount is in GBOND (18 decimals)
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to redeem bond')
    }
  }

  // Claim Yield
  const claim = async () => {
    try {
      writeBuy({
        address: COUPON_DISTRIBUTOR.address,
        abi: COUPON_DISTRIBUTOR.abi,
        functionName: 'claim'
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to claim yield')
    }
  }

  // Format as 6 decimals
  const usdtBalance = rawBalance ? formatUnits(rawBalance as bigint, 6) : "0"

  return {
    approve,
    buy,
    redeem,
    claim,
    allowance: allowance ? allowance : BigInt(0),
    refetchAllowance,
    isApprovePending: isApprovePending || isApproveConfirming,
    approveHash,
    isBuyPending,
    buyHash,
    buyError,
    allowanceError,
    usdtBalance,
    isBuyConfirmed
  }
}
