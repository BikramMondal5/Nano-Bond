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

export function Web3AuthConnectButton() {
    const {
        login,
        logout,
        loggedIn,
        walletAddress,
        balance,
        isInitializing
    } = useWeb3AuthContext();

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (isInitializing) {
        return (
            <Button variant="outline" disabled className="border-orange-500/30 bg-orange-950/20">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Initializing...
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
                        Copy Address
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        className="text-red-400 hover:bg-red-950/40 cursor-pointer"
                        onClick={logout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Disconnect
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <Button
            onClick={login}
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold"
        >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
        </Button>
    );
}
