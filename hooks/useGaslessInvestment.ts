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
    const [selectedNetwork, setSelectedNetwork] = useState<string>('mantle')

    /**
     * One-click gasless investment
     * The backend pays for gas and executes the transaction
     */
    const invest = async (amount: string, bondId: string, network: string = 'mantle') => {
        if (!walletAddress) {
            toast.error('Please connect your wallet first')
            return
        }

        setIsPending(true)
        setError(null)
        setIsSuccess(false)

        try {
            console.log(`[Gasless] Investing ${amount} USDT from ${network} for ${walletAddress}`)

            const response = await axios.post(`${BACKEND_URL}/api/invest`, {
                address: walletAddress,
                amount: parseFloat(amount),
                bondId,
                network
            })

            if (response.data.success) {
                setTxHash(response.data.txHash)
                setIsSuccess(true)

                if (response.data.isCrossChain) {
                    toast.success(`Cross-chain investment from ${network.toUpperCase()} initiated! Bonds arriving in ~5-10 min.`)
                } else {
                    toast.success(`Successfully invested ${amount} USDT!`)
                }

                return response.data // Return response for additional handling
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
    const requestFaucet = async (amount: number = 1000, network: string = 'mantle') => {
        if (!walletAddress) {
            toast.error('Please connect your wallet first')
            return
        }

        setIsPending(true)
        try {
            const response = await axios.post(`${BACKEND_URL}/api/faucet/usdt`, {
                address: walletAddress,
                amount,
                network // Add network parameter
            })

            if (response.data.success) {
                toast.success(`Received ${amount} USDT on ${network.toUpperCase()}!`)
                return response.data.txHash
            }
        } catch (err: any) {
            toast.error('Faucet error: ' + (err.response?.data?.error || err.message))
        } finally {
            setIsPending(false)
        }
    }

    /**
       * Get USDT balance from Next.js API for specific network
     */
    const getBalance = async (network: string = 'mantle') => {
        if (!walletAddress) return '0'

        try {
            console.log(`[Hook] Fetching balance for ${walletAddress} on ${network}`);

            // Use Next.js API route which supports multi-network queries
            const response = await axios.get(`/api/faucet/balance/${walletAddress}?network=${network}`)

            console.log(`[Hook] Balance response:`, response.data);

            if (response.data.success) {
                return response.data.balance?.toString() || '0'
            } else {
                console.error('[Hook] Balance fetch failed:', response.data.error);
                return '0'
            }
        } catch (error: any) {
            console.error('[Hook] Error fetching balance:', error.response?.data || error.message);
            return '0'
        }
    }

    /**
     * One-click gasless redemption
     */
    const redeem = async (amount: string, bondId: string) => {
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
    const claim = async (bondId: string) => {
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
        selectedNetwork,
        setSelectedNetwork,
        reset: () => {
            setIsSuccess(false)
            setTxHash(null)
            setError(null)
        }
    }
}
