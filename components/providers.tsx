'use client';

import * as React from 'react';
import { createContext, useContext, ReactNode } from 'react';
import { useWeb3Auth } from '@/hooks/use-web3auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Create Web3Auth Context
interface Web3AuthContextType {
    provider: any;
    loggedIn: boolean;
    login: () => Promise<any>;
    logout: () => Promise<void>;
    userInfo: any;
    walletAddress: string | null;
    balance: string | null;
    isInitializing: boolean;
    error: string | null;
    getEthersProvider: () => any;
    getSigner: () => Promise<any>;
}

const Web3AuthContext = createContext<Web3AuthContextType | null>(null);

export function useWeb3AuthContext() {
    const context = useContext(Web3AuthContext);
    if (!context) {
        throw new Error('useWeb3AuthContext must be used within Web3AuthProvider');
    }
    return context;
}

function Web3AuthContextProvider({ children }: { children: ReactNode }) {
    const web3auth = useWeb3Auth();

    return (
        <Web3AuthContext.Provider value={web3auth}>
            {children}
        </Web3AuthContext.Provider>
    );
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <Web3AuthContextProvider>
                {children}
            </Web3AuthContextProvider>
        </QueryClientProvider>
    );
}