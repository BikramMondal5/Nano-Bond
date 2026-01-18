"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Banknote, Wallet, ArrowRight, ArrowLeft, Loader2, RefreshCw, Plus, Minus } from "lucide-react"
import { ethers } from "ethers"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    const [amount, setAmount] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Derived states
    const usdtAddress = paymentTokenAddress || "0xF62f02BCE0Ae48941B4b7e67A512F473D55e23b1"

    const { toast } = useToast()

    // Fetch Treasury Balance
    const fetchBalance = async () => {
        try {
            setIsRefreshing(true)
            if (!window.ethereum) return

            const provider = new ethers.BrowserProvider(window.ethereum)
            const usdtAbi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"]
            const usdt = new ethers.Contract(usdtAddress, usdtAbi, provider)

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

    // WITHDRAW: Treasury -> Admin
    const handleWithdraw = async () => {
        if (!amount || isNaN(Number(amount))) {
            showError("Please enter a valid amount.")
            return
        }

        setIsLoading(true)
        try {
            if (!window.ethereum) throw new Error("No wallet found")
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()

            const treasuryAbi = ["function withdrawReserves(address to, uint256 amount) external"]
            const treasury = new ethers.Contract(treasuryAddress, treasuryAbi, signer)

            const destination = await signer.getAddress()
            const amountWei = ethers.parseUnits(amount, 6)

            console.log(`Withdrawing ${amount} USDT to ${destination}`)

            const tx = await treasury.withdrawReserves(destination, amountWei)

            toast({ title: "Withdrawal Sent", description: "Transaction initiated..." })
            await tx.wait()
            toast({ title: "Success", description: `Withdrew ${formatCurrency(Number(amount))} USDT` })

            setAmount("")
            fetchBalance()

        } catch (error: any) {
            handleError(error)
        } finally {
            setIsLoading(false)
        }
    }

    // DEPOSIT: Admin -> Treasury
    const handleDeposit = async () => {
        if (!amount || isNaN(Number(amount))) {
            showError("Please enter a valid amount.")
            return
        }

        setIsLoading(true)
        try {
            if (!window.ethereum) throw new Error("No wallet found")
            const provider = new ethers.BrowserProvider(window.ethereum)
            const signer = await provider.getSigner()

            const usdtAbi = ["function transfer(address to, uint256 amount) external returns (bool)"]
            const usdt = new ethers.Contract(usdtAddress, usdtAbi, signer)

            const amountWei = ethers.parseUnits(amount, 6)

            console.log(`Depositing ${amount} USDT to ${treasuryAddress}`)

            const tx = await usdt.transfer(treasuryAddress, amountWei)

            toast({ title: "Deposit Sent", description: "Transaction initiated..." })
            await tx.wait()
            toast({ title: "Success", description: `Deposited ${formatCurrency(Number(amount))} USDT` })

            setAmount("")
            fetchBalance()

        } catch (error: any) {
            handleError(error)
        } finally {
            setIsLoading(false)
        }
    }

    const showError = (msg: string) => {
        toast({ variant: "destructive", title: "Error", description: msg })
    }

    const handleError = (error: any) => {
        console.error("Action failed:", error)
        toast({
            variant: "destructive",
            title: "Action Failed",
            description: error.reason || error.message || "Unknown error"
        })
    }

    return (
        <Card className="bg-black/40 border-orange-500/20 text-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Banknote className="w-5 h-5 text-green-500" />
                    Treasury Management
                </CardTitle>
                <CardDescription>
                    Manage liquidity reserves for {bondSymbol}.
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

                <Tabs defaultValue="withdraw" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10">
                        <TabsTrigger value="withdraw" className="data-[state=active]:bg-red-900/40 data-[state=active]:text-red-400">
                            Withdraw
                        </TabsTrigger>
                        <TabsTrigger value="deposit" className="data-[state=active]:bg-green-900/40 data-[state=active]:text-green-400">
                            Add Funds
                        </TabsTrigger>
                    </TabsList>

                    {/* Withdraw Tab */}
                    <TabsContent value="withdraw" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Amount to Withdraw</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-black/50 border-white/10 pr-16"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">USDT</div>
                            </div>
                            <p className="text-xs text-gray-500">Extracts funds to Admin Wallet.</p>
                        </div>
                        <Button
                            className="w-full bg-red-900/50 hover:bg-red-900 text-red-100 border border-red-900"
                            onClick={handleWithdraw}
                            disabled={isLoading || Number(balance) === 0}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Minus className="w-4 h-4 mr-2" />}
                            Withdraw Funds
                        </Button>
                    </TabsContent>

                    {/* Deposit Tab */}
                    <TabsContent value="deposit" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Amount to Deposit</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-black/50 border-white/10 pr-16"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">USDT</div>
                            </div>
                            <p className="text-xs text-gray-500">Injects funds from Admin Wallet.</p>
                        </div>
                        <Button
                            className="w-full bg-green-900/50 hover:bg-green-900 text-green-100 border border-green-900"
                            onClick={handleDeposit}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                            Add Funds
                        </Button>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
