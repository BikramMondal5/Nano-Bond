import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { TREASURY_SWAP, USDT, COUPON_DISTRIBUTOR } from '@/lib/contracts'
import { toast } from 'sonner'
import { useWeb3AuthContext } from '@/components/providers'

export function useInvestment() {
  const { walletAddress, getSigner, getEthersProvider, loggedIn } = useWeb3AuthContext()

  const [isApprovePending, setIsApprovePending] = useState(false)
  const [isBuyPending, setIsBuyPending] = useState(false)
  const [approveHash, setApproveHash] = useState<string | null>(null)
  const [buyHash, setBuyHash] = useState<string | null>(null)
  const [buyError, setBuyError] = useState<Error | null>(null)
  const [allowance, setAllowance] = useState<bigint>(BigInt(0))
  const [usdtBalance, setUsdtBalance] = useState<string>("0")
  const [isBuyConfirmed, setIsBuyConfirmed] = useState(false)

  // Fetch allowance
  const refetchAllowance = useCallback(async () => {
    if (!walletAddress || !loggedIn) return

    try {
      const provider = getEthersProvider()
      if (!provider) return

      const usdt = new ethers.Contract(USDT.address, USDT.abi, provider)
      const allowanceValue = await usdt.allowance(walletAddress, TREASURY_SWAP.address)
      setAllowance(allowanceValue)
    } catch (error) {
      console.error('Failed to fetch allowance:', error)
    }
  }, [walletAddress, loggedIn, getEthersProvider])

  // Fetch USDT balance
  const refetchBalance = useCallback(async () => {
    if (!walletAddress || !loggedIn) return

    try {
      const provider = getEthersProvider()
      if (!provider) return

      const usdt = new ethers.Contract(USDT.address, USDT.abi, provider)
      const balance = await usdt.balanceOf(walletAddress)
      setUsdtBalance(ethers.formatUnits(balance, 6))
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  }, [walletAddress, loggedIn, getEthersProvider])

  // Approve USDT for TreasurySwap
  const approve = async (amount: string) => {
    try {
      setIsApprovePending(true)
      const signer = await getSigner()
      if (!signer) throw new Error('No signer available')

      const usdt = new ethers.Contract(USDT.address, USDT.abi, signer)
      const amountBig = ethers.parseUnits(amount, 6)

      const tx = await usdt.approve(TREASURY_SWAP.address, amountBig)
      setApproveHash(tx.hash)

      await tx.wait()
      toast.success('USDT Approved successfully!')
      await refetchAllowance()
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to approve USDT: ' + err.message)
    } finally {
      setIsApprovePending(false)
    }
  }

  // Buy Bond
  const buy = async (amount: string) => {
    try {
      setIsBuyPending(true)
      setIsBuyConfirmed(false)
      setBuyError(null)

      const signer = await getSigner()
      if (!signer) throw new Error('No signer available')

      const treasury = new ethers.Contract(TREASURY_SWAP.address, TREASURY_SWAP.abi, signer)
      const amountBig = ethers.parseUnits(amount, 6)

      const tx = await treasury.buy(amountBig)
      setBuyHash(tx.hash)

      await tx.wait()
      setIsBuyConfirmed(true)
      toast.success('Bond purchased successfully!')
      await refetchBalance()
    } catch (err: any) {
      console.error(err)
      setBuyError(err)
      toast.error('Failed to buy bond: ' + err.message)
    } finally {
      setIsBuyPending(false)
    }
  }

  // Redeem Bond
  const redeem = async (amount: string) => {
    try {
      setIsBuyPending(true)
      const signer = await getSigner()
      if (!signer) throw new Error('No signer available')

      const treasury = new ethers.Contract(TREASURY_SWAP.address, TREASURY_SWAP.abi, signer)
      const amountBig = ethers.parseUnits(amount, 18) // GBOND is 18 decimals

      const tx = await treasury.redeem(amountBig)
      await tx.wait()
      toast.success('Bond redeemed successfully!')
      await refetchBalance()
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to redeem bond: ' + err.message)
    } finally {
      setIsBuyPending(false)
    }
  }

  // Claim Yield
  const claim = async () => {
    try {
      setIsBuyPending(true)
      const signer = await getSigner()
      if (!signer) throw new Error('No signer available')

      const distributor = new ethers.Contract(COUPON_DISTRIBUTOR.address, COUPON_DISTRIBUTOR.abi, signer)

      const tx = await distributor.claim()
      await tx.wait()
      toast.success('Yield claimed successfully!')
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to claim yield: ' + err.message)
    } finally {
      setIsBuyPending(false)
    }
  }

  return {
    approve,
    buy,
    redeem,
    claim,
    allowance,
    refetchAllowance,
    isApprovePending,
    approveHash,
    isBuyPending,
    buyHash,
    buyError,
    allowanceError: null,
    usdtBalance,
    isBuyConfirmed,
    refetchBalance
  }
}
