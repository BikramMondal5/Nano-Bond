"use client"

import { useState } from "react"
import { Wallet, Coins, Percent, Clock, Lock, Unlock, PlayCircle, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatUnits } from "viem"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAdminActions, useBondStats, useTreasuryStats, useDistributorStats } from "@/hooks/useAdminActions"

interface VaultControlsProps {
    enabled: boolean
}

export function VaultControls({ enabled }: VaultControlsProps) {
    const [locked, setLocked] = useState(false)
    const { distributeYield, approveUSDT, isPending } = useAdminActions()
    const { totalSupply, backedValue, maturityDate } = useBondStats()
    const { distributorBalance, cumulativeYield } = useDistributorStats()

    // Calculations
    // Bond and Backed Value are 18 decimals now
    const totalDeposited = backedValue ? Number(formatUnits(backedValue as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "..."
    const totalMinted = totalSupply ? Number(formatUnits(totalSupply as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "..."

    // Estimate Total Distributed
    // cumulativeYield is 18 decimals (scaled). Supply is 18 decimals.
    // Total = (Yield * Supply) / 1e18
    const cumYieldNum = cumulativeYield ? Number(formatUnits(cumulativeYield as bigint, 18)) : 0
    const supplyNum = totalSupply ? Number(formatUnits(totalSupply as bigint, 18)) : 0

    // Result is in standard units (USDT/GBOND same scale)
    const formattedDistributed = (cumYieldNum * supplyNum).toLocaleString(undefined, { maximumFractionDigits: 2 })

    const tokensLeftToClaim = distributorBalance ? Number(formatUnits(distributorBalance as bigint, 6)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "..."

    // Maturity Calc
    let maturityDays = "..."
    if (maturityDate) {
        const now = Math.floor(Date.now() / 1000)
        const maturity = Number(maturityDate)
        if (maturity > now) {
            maturityDays = Math.ceil((maturity - now) / 86400).toString()
        } else {
            maturityDays = "0"
        }
    }

    const handleAction = (action: string) => {
        if (action === "Yield Distribution") {
            distributeYield("1000") // Mock 1000 USDT for now
            toast.info("Yield distribution transaction initiated...")
        } else if (action === "Approve USDT") {
            approveUSDT("100000") // Approve sufficiently large amount
            toast.info("USDT Approval initiated...")
        } else {
            toast.success(`${action} initiated successfully.`)
        }
    }

    return (
        <div className={cn("space-y-6 transition-all duration-500", !enabled && "opacity-40 grayscale pointer-events-none")}>

            {/* Real-Time Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatsCard
                    title="Total Amount Deposited"
                    value={totalDeposited}
                    icon={Wallet}
                    subtext="USDT Backing"
                />
                <StatsCard
                    title="Total Tokens Minted"
                    value={totalMinted}
                    icon={Coins}
                    subtext="GBOND Supply"
                />
                <StatsCard
                    title="Total Distributed Tokens"
                    value={formattedDistributed}
                    icon={Percent}
                    subtext="Yield Distributed"
                    highlight
                />
                <StatsCard
                    title="Tokens Left to be Claimed"
                    value={tokensLeftToClaim}
                    icon={AlertCircle}
                    subtext="Distributor Balance"
                />
                <StatsCard
                    title="Maturity Days Left"
                    value={maturityDays}
                    icon={Clock}
                    subtext="Ends: Jan 2027"
                />
            </div>

            {/* Vault Actions Panel */}
            <Card className="bg-[#100F14] border-orange-500/20">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Lock className="w-5 h-5 text-[#FD8C00]" /> Vault Actions
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Controls for yield distribution, maturity, and deposit management.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">

                    <ActionDialog
                        trigger={<Button variant="outline" className="border-[#FD8C00] text-[#FD8C00] hover:bg-[#FD8C00] hover:text-black"><Coins className="w-4 h-4 mr-2" /> Trigger Yield Distribution</Button>}
                        title="Trigger Yield Distribution?"
                        desc="This will calculate and distribute pending interest to all active bond holders. This action cannot be undone."
                        onConfirm={() => handleAction("Yield Distribution")}
                    />

                    <Button
                        variant="default"
                        onClick={() => handleAction("Approve USDT")}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Coins className="w-4 h-4 mr-2" /> Approve USDT
                    </Button>

                    <ActionDialog
                        trigger={<Button variant="outline" className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500"><Clock className="w-4 h-4 mr-2" /> Set Maturity Manually</Button>}
                        title="Set Maturity Manually?"
                        desc="Are you sure? This will override the smart contract maturity date."
                        onConfirm={() => handleAction("Manual Maturity Set")}
                    />

                    <Button
                        variant="outline"
                        onClick={() => { setLocked(!locked); toast.message(locked ? "Deposits Unlocked" : "Deposits Locked"); }}
                        className={cn("border-gray-700 text-gray-300 hover:text-white", locked ? "bg-red-900/20 border-red-500/50 text-red-500" : "")}
                    >
                        {locked ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                        {locked ? "Unlock Deposits" : "Lock Deposits"}
                    </Button>

                    <Button variant="ghost" className="text-gray-500 hover:text-white ml-auto">
                        <RefreshCw className="w-4 h-4 mr-2" /> Clear Pending
                    </Button>

                </CardContent>
            </Card>

        </div>
    )
}

function StatsCard({ title, value, icon: Icon, subtext, highlight }: { title: string, value: string, icon: any, subtext: string, highlight?: boolean }) {
    return (
        <Card className="bg-[#100F14] border-gray-800 hover:border-orange-500/30 transition-colors">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-gray-400">{title}</p>
                    <div className={cn("p-2 rounded-lg", highlight ? "bg-[#FD8C00]/20 text-[#FD8C00]" : "bg-gray-800 text-gray-400")}>
                        <Icon className="w-4 h-4" />
                    </div>
                </div>
                <div className="space-y-1">
                    <h3 className={cn("text-2xl font-bold", highlight ? "text-[#FD8C00]" : "text-white")}>{value}</h3>
                    <p className="text-xs text-gray-500">{subtext}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function ActionDialog({ trigger, title, desc, onConfirm }: { trigger: React.ReactNode, title: string, desc: string, onConfirm: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {trigger}
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#1A1A1A] border-gray-800 text-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                        {desc}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-[#FD8C00] text-black hover:bg-[#E67E00] font-bold">Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
