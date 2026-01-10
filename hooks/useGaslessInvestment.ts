import { useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { useWeb3AuthContext } from '@/components/providers'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

export function useGaslessInvestment() {
    const { walletAddress } = useWeb3AuthContext()

    const [isPending, setIsPending] = useState(false)
    const [txHash, setTxHash] = useState<string | null>(null)
    const [error, setError] = useState<Error | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)

    /**
     * One-click gasless investment
     * The backend pays for gas and executes the transaction
     */
    const invest = async (amount: string, bondId: string = 'GOI-2030') => {
        if (!walletAddress) {
            toast.error('Please connect your wallet first')
            return
        }

        setIsPending(true)
        setError(null)
        setIsSuccess(false)

        try {
            console.log(`[Gasless] Investing ${amount} USDT for ${walletAddress}`)

            const response = await axios.post(`${BACKEND_URL}/api/invest`, {
                address: walletAddress,
                amount: parseFloat(amount),
                bondId
            })

            if (response.data.success) {
                setTxHash(response.data.txHash)
                setIsSuccess(true)
                toast.success(`Successfully invested ${amount} USDT!`)
            } else {
                throw new Error(response.data.error || 'Investment failed')
            }
        } catch (err: any) {
            console.error('[Gasless] Investment error:', err)
            setError(err)
            toast.error('Investment failed: ' + (err.response?.data?.error || err.message))
        } finally {
            setIsPending(false)
        }
    }

    /**
     * Request test USDT from faucet
     */
    const requestFaucet = async (amount: number = 1000) => {
        if (!walletAddress) {
            toast.error('Please connect your wallet first')
            return
        }

        setIsPending(true)
        try {
            const response = await axios.post(`${BACKEND_URL}/api/faucet/usdt`, {
                address: walletAddress,
                amount
            })

            if (response.data.success) {
                toast.success(`Received ${amount} USDT from faucet!`)
                return response.data.txHash
            }
        } catch (err: any) {
            toast.error('Faucet error: ' + (err.response?.data?.error || err.message))
        } finally {
            setIsPending(false)
        }
    }

    /**
     * Get USDT balance from backend
     */
    const getBalance = async () => {
        if (!walletAddress) return '0'

        try {
            const response = await axios.get(`${BACKEND_URL}/api/faucet/balance/${walletAddress}`)
            return response.data.balance?.toString() || '0'
        } catch {
            return '0'
        }
    }

    /**
     * One-click gasless redemption
     */
    const redeem = async (amount: string, bondId: string = 'GOI-2030') => {
        if (!walletAddress) {
            toast.error('Please connect your wallet first')
            return
        }

        setIsPending(true)
        setError(null)
        setIsSuccess(false)

        try {
            console.log(`[Gasless] Redeeming ${amount} GBOND for ${walletAddress}`)

            const response = await axios.post(`${BACKEND_URL}/api/redeem`, {
                address: walletAddress,
                amount: amount, // sending as string/number
                bondId
            })

            if (response.data.success) {
                setTxHash(response.data.txHash)
                setIsSuccess(true)
                toast.success(`Successfully redeemed ${amount} GBOND!`)
            } else {
                throw new Error(response.data.error || 'Redemption failed')
            }
        } catch (err: any) {
            console.error('[Gasless] Redemption error:', err)
            setError(err)
            toast.error('Redemption failed: ' + (err.response?.data?.error || err.message))
        } finally {
            setIsPending(false)
        }
    }

    /**
     * One-click gasless claim
     */
    const claim = async (bondId: string = 'GOI-2030') => {
        if (!walletAddress) {
            toast.error('Please connect your wallet first')
            return
        }

        setIsPending(true)
        setError(null)
        setIsSuccess(false)

        try {
            console.log(`[Gasless] Claiming yield for ${walletAddress}`)

            const response = await axios.post(`${BACKEND_URL}/api/claim`, {
                address: walletAddress,
                bondId
            })

            if (response.data.success) {
                setTxHash(response.data.txHash)
                setIsSuccess(true)
                toast.success(response.data.message || `Successfully claimed yield!`)
            } else {
                throw new Error(response.data.error || 'Claim failed')
            }
        } catch (err: any) {
            console.error('[Gasless] Claim error:', err)
            setError(err)
            toast.error('Claim failed: ' + (err.response?.data?.error || err.message))
        } finally {
            setIsPending(false)
        }
    }

    return {
        invest,
        redeem,
        claim,
        requestFaucet,
        getBalance,
        isPending,
        txHash,
        error,
        isSuccess,
        walletAddress,
        reset: () => {
            setIsSuccess(false)
            setTxHash(null)
            setError(null)
        }
    }
}
