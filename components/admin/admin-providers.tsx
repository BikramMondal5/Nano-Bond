'use client';

import * as React from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
    RainbowKitProvider,
    darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// Define Mantle Sepolia Chain
const mantleSepolia = {
    id: 5003,
    name: 'Mantle Sepolia',
    iconUrl: 'https://assets.coingecko.com/coins/images/30980/small/token-logo.png?1689320029',
    iconBackground: '#000',
    nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.sepolia.mantle.xyz'] },
    },
    blockExplorers: {
        default: { name: 'Mantle Explorer', url: 'https://sepolia.mantlescan.xyz' },
    },
} as const;

const config = getDefaultConfig({
    appName: 'Sovereign Bond Admin',
    projectId: 'YOUR_PROJECT_ID', // Replaced with a placeholder or env variable
    chains: [mantleSepolia],
    ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();

export function AdminProviders({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={darkTheme()}>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
