"use client"

import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useSession } from 'next-auth/react'
import axios from 'axios'

export function WalletSync() {
    const { address, isConnected } = useAccount()
    const { data: session, update } = useSession()

    useEffect(() => {
        const syncWallet = async () => {
            if (isConnected && address && session?.user) {
                // Only update if wallet address changed
                if (address !== session.user.walletAddress) {
                    try {
                        await axios.post('/api/user/wallet', { walletAddress: address })
                        // Update session with new wallet address
                        await update()
                    } catch (error) {
                        console.error('Failed to sync wallet:', error)
                    }
                }
            }
        }

        syncWallet()
    }, [address, isConnected, session, update])

    return null
}