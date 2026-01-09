'use client';

import { AdminProviders } from "@/components/admin/admin-providers"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AdminProviders>
            <div className="relative flex flex-col min-h-screen">
                <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 bg-[#0A0A0A]/50 backdrop-blur-xl">
                    <div className="container h-full flex items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white">NanoBond Admin</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                MANTLE SEPOLIA
                            </span>
                        </div>
                        <ConnectButton
                            accountStatus="address"
                            chainStatus="icon"
                            showBalance={false}
                        />
                    </div>
                </header>
                <main className="flex-1 pt-16">
                    {children}
                </main>
            </div>
        </AdminProviders>
    )
}
