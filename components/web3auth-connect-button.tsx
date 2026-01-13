"use client"

import { Button } from "@/components/ui/button"
import { Wallet, Loader2, LogOut } from "lucide-react"
import { useWeb3AuthContext } from "@/components/providers"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function Web3AuthConnectButton() {
    const content = useContentTranslation({
        initializing: "Initializing...",
        copy_address: "Copy Address",
        disconnect: "Disconnect",
        retry: "Retry",
        connect_wallet: "Connect Wallet"
    })

    const {
        login,
        logout,
        loggedIn,
        walletAddress,
        balance,
        isInitializing,
        error
    } = useWeb3AuthContext();

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (isInitializing) {
        return (
            <Button variant="outline" disabled className="border-orange-500/30 bg-orange-950/20">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {content.initializing}
            </Button>
        );
    }

    if (loggedIn && walletAddress) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="border-orange-500/30 bg-orange-950/20 hover:bg-orange-950/40 text-orange-200"
                    >
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                        <Wallet className="w-4 h-4 mr-2" />
                        <span>{formatAddress(walletAddress)}</span>
                        {balance && (
                            <span className="ml-2 text-orange-400 font-mono text-sm">
                                {balance} MNT
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-orange-500/30">
                    <DropdownMenuItem
                        className="text-orange-200 hover:bg-orange-950/40 cursor-pointer"
                        onClick={() => navigator.clipboard.writeText(walletAddress)}
                    >
                        <Wallet className="w-4 h-4 mr-2" />
                        {content.copy_address}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-red-400 hover:bg-red-950/40 cursor-pointer"
                        onClick={logout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        {content.disconnect}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center gap-2">
                <Button variant="destructive" className="bg-red-900/50 border-red-500 hover:bg-red-900/70" onClick={() => window.location.reload()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {content.retry}
                </Button>
                <span className="text-xs text-red-500 max-w-[200px] text-center">{error}</span>
            </div>
        );
    }

    return (
        <Button
            onClick={login}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold"
        >
            <Wallet className="w-4 h-4 mr-2" />
            {content.connect_wallet}
        </Button>
    );
}
