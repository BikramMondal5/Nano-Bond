"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { useWeb3AuthContext } from '@/components/providers'

export function WalletSync() {
    const { walletAddress, loggedIn } = useWeb3AuthContext()
    const { data: session, update } = useSession()

    useEffect(() => {
        const syncWallet = async () => {
            if (loggedIn && walletAddress && session?.user) {
                const currentSessionWallet = session.user.walletAddress?.toLowerCase();
                const currentWallet = walletAddress.toLowerCase();

                if (currentWallet !== currentSessionWallet) {
                    try {
                        await axios.post('/api/user/wallet', { walletAddress })
                        await update()
                    } catch (error) {
                        console.error('Failed to sync wallet:', error)
                    }
                }
            }
        }

        syncWallet()
    }, [walletAddress, loggedIn, session, update])

    return null
}