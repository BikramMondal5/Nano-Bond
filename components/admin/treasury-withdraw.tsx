import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Banknote, Wallet, ArrowRight, Loader2, RefreshCw } from "lucide-react"
import { ethers } from "ethers"
import { useToast } from "@/components/ui/use-toast"

// Local helper if not in utils
const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(val)
}

interface TreasuryWithdrawProps {
    treasuryAddress: string
    bondSymbol: string
    paymentTokenAddress?: string // USDT address
}

export function TreasuryWithdraw({ treasuryAddress, bondSymbol, paymentTokenAddress }: TreasuryWithdrawProps) {
    const [balance, setBalance] = useState<string>("0")
    const [withdrawAmount, setWithdrawAmount] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const { toast } = useToast()

    // Fetch Treasury Balance
    const fetchBalance = async () => {
        try {
            setIsRefreshing(true)
            if (!window.ethereum) return

            const provider = new ethers.BrowserProvider(window.ethereum)
            // We need USDT contract to check balance of Treasury
            const usdtAddr = paymentTokenAddress || "0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1" // Default to config
            const usdtAbi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"]
            const usdt = new ethers.Contract(usdtAddr, usdtAbi, provider)

            const bal = await usdt.balanceOf(treasuryAddress)
            const decimals = await usdt.decimals()
            setBalance(ethers.formatUnits(bal, decimals))
        } catch (err) {
            console.error("Failed to fetch treasury balance:", err)
        } finally {
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchBalance()
    }, [treasuryAddress])

    const handleWithdraw = async () => {
        if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
            toast({
                variant: "destructive",
                title: "Invalid Amount",
                description: "Please enter a valid amount to withdraw."
            })
            return
        }

        setIsLoading(true)
        try {
            // withdrawReserves on TreasurySwap: function withdrawReserves(address to, uint256 amount)
            // We need the signer's address (Admin) as 'to' usually, or separate input.
            // Let's assume withdrawing to Admin Wallet (msg.sender)

            // Since useAdminActions might be specific to Bond, let's just call contract directly here for simplicity
            // or assumes the hook has a generic 'execute'

            if (!window.ethereum) throw new Error("No wallet found")
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()

            const treasuryAbi = ["function withdrawReserves(address to, uint256 amount) external"]
            const treasury = new ethers.Contract(treasuryAddress, treasuryAbi, signer)

            // Admin withdraws to themselves
            const destination = await signer.getAddress()
            const amountWei = ethers.parseUnits(withdrawAmount, 6) // Assuming USDT 6 decimals

            console.log(`Withdrawing ${withdrawAmount} USDT to ${destination}`)

            const tx = await treasury.withdrawReserves(destination, amountWei)

            toast({
                title: "Transaction Sent",
                description: "Withdrawal initiated. Waiting for confirmation..."
            })

            await tx.wait()

            toast({
                title: "Success",
                description: `Successfully withdrew ${formatCurrency(Number(withdrawAmount))} USDT`
            })

            setWithdrawAmount("")
            fetchBalance()

        } catch (error: any) {
            console.error("Withdrawal failed:", error)
            toast({
                variant: "destructive",
                title: "Withdrawal Failed",
                description: error.reason || error.message || "Unknown error"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="bg-black/40 border-orange-500/20 text-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Banknote className="w-5 h-5 text-green-500" />
                    Treasury Vault
                </CardTitle>
                <CardDescription>
                    Manage collected funds for {bondSymbol}.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Balance Display */}
                <div className="p-4 rounded-lg bg-black/60 border border-white/10 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Available Reserves</p>
                        <div className="text-2xl font-bold font-mono text-green-400">
                            {formatCurrency(Number(balance))} <span className="text-sm text-gray-500">USDT</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchBalance} disabled={isRefreshing}>
                        <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Withdraw Amount (USDT)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="bg-black/50 border-white/10 pr-16"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                USDT
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">
                            Withdrawing funds to Admin Wallet for real-world bond purchase.
                        </p>
                    </div>

                    <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleWithdraw}
                        disabled={isLoading || Number(balance) === 0}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Wallet className="w-4 h-4 mr-2" />
                                Withdraw to Admin Wallet
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
