"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Wallet, ArrowRightLeft, ShieldCheck, AlertCircle, Loader2, CheckCircle2, Droplet, Building2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useWeb3AuthContext } from "@/components/providers"
import { useGaslessInvestment } from "@/hooks/useGaslessInvestment"
import { useBondStats } from "@/hooks/useAdminActions"
import { ethers } from "ethers"
import { Web3AuthConnectButton } from "@/components/web3auth-connect-button"
import type { IBond } from "@/lib/models/Bond"

interface InvestmentCardProps {
  bond: IBond;
}

export function InvestmentCard({ bond }: InvestmentCardProps) {
  const [amount, setAmount] = useState("")
  const { walletAddress, loggedIn } = useWeb3AuthContext()
  const { totalSupply, backedValue } = useBondStats()
  const {
    invest,
    requestFaucet,
    getBalance,
    isPending,
    isSuccess,
    txHash,
    reset
  } = useGaslessInvestment()

  const [usdtBalance, setUsdtBalance] = useState("0")

  // Reset state when bond changes
  useEffect(() => {
    reset()
    setAmount("")
  }, [bond.bondId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch balance on mount and after actions
  useEffect(() => {
    if (walletAddress && loggedIn) {
      getBalance().then(setUsdtBalance)
    }
  }, [walletAddress, loggedIn, isSuccess])

  const tokenPrice = 1.00 // 1 GBOND = 1 USDT
  const minInvest = bond.minInvestment || 1

  // Use on-chain logic if available, else fallback to bond metadata
  // Ideally, we'd fetch stats per bond address
  const maxInvest = bond.maxSubscription || 1000000

  const expectedTokens = amount ? (Number(amount) / tokenPrice).toFixed(2) : "0"
  const isValidAmount = Number(amount) >= minInvest && Number(amount) <= maxInvest && Number(amount) <= Number(usdtBalance)

  const handleInvest = async () => {
    // Pass the selected bond ID to the hook
    await invest(amount, bond.bondId)
  }

  const handleFaucet = async () => {
    await requestFaucet(1000)
    const newBalance = await getBalance()
    setUsdtBalance(newBalance)
  }

  if (isSuccess) {
    return (
      <Card className="bg-[#100F14] border-orange-500/20 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16" />
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Investment Successful!</h3>
            <p className="text-muted-foreground">You have received {expectedTokens} {bond.bondName} tokens.</p>
            {txHash && <p className="text-xs text-gray-500 font-mono">Tx: {txHash}</p>}
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-white font-bold py-6 px-8 rounded-xl"
            onClick={() => {
              reset()
              setAmount("")
            }}
          >
            Invest More
          </Button>
          {txHash && (
            <a
              href={`https://explorer.sepolia.mantle.xyz/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline flex items-center gap-1"
            >
              View Transaction on Explorer
              <ArrowRightLeft className="w-3 h-3" />
            </a>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#100F14] border-orange-500/20 shadow-2xl overflow-hidden relative transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16" />

      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              Purchase {bond.bondName}
            </CardTitle>
            <div className="text-xs text-muted-foreground font-mono bg-white/5 px-2 py-0.5 rounded w-fit">
              ID: {bond.bondId}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-green-500 uppercase tracking-wider">Gasless</span>
          </div>
        </div>
        <CardDescription className="text-muted-foreground text-sm pt-2">
          {bond.description || "One-click investment with zero gas fees - backend pays for you!"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!loggedIn ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center border border-white/5">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-lg font-medium text-white">Wallet Not Connected</h4>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Connect your wallet to start investing in Government Bonds.
              </p>
            </div>
            <div className="transform scale-110">
              <Web3AuthConnectButton />
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Balance Section */}
            <div className="flex items-center justify-between p-4 bg-[#1C1A21] rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">Your USDT Balance</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-primary">{Number(usdtBalance).toLocaleString()} USDT</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                        onClick={handleFaucet}
                        disabled={isPending}
                      >
                        <Droplet className="w-4 h-4 mr-1" />
                        Faucet
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Get 1000 test USDT</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Input Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Amount to Invest</label>
                <span className="text-xs font-semibold text-[#FD8C00]">
                  Limit: {maxInvest.toLocaleString()} USDT
                </span>
              </div>
              <div className="relative group">
                <Input
                  type="number"
                  placeholder={`Min ${minInvest} USDT`}
                  className="bg-[#1C1A21] border-white/5 h-16 text-xl pl-4 pr-16 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isPending}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">USDT</div>
              </div>
              {amount && !isValidAmount && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {Number(amount) > Number(usdtBalance)
                    ? `Insufficient balance. Your balance: ${Number(usdtBalance).toFixed(2)}`
                    : Number(amount) > maxInvest
                      ? `Amount exceeds max limit`
                      : `Minimum investment is ${minInvest} USDT`}
                </p>
              )}
            </div>

            {/* Conversion Result */}
            <div className="p-4 bg-[#1C1A21] rounded-xl border border-white/5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-sm text-muted-foreground">You will receive</span>
                <div className="flex items-center gap-1.5 text-green-500 text-xs font-bold uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Zero Gas Fee
                </div>
              </div>
              <div className="flex items-end gap-2 relative z-10">
                <span className="text-3xl font-bold text-white leading-none">{expectedTokens}</span>
                <span className="text-lg font-medium text-muted-foreground mb-0.5">GBOND</span>
              </div>
              <div className="pt-3 border-t border-white/5 flex flex-col gap-1.5 text-xs text-muted-foreground relative z-10">
                <div className="flex justify-between">
                  <span>Rate</span>
                  <span className="text-white">1 GBOND = {tokenPrice} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span>Maturity</span>
                  <span className="text-white">{new Date(bond.maturityDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Single Invest Button */}
            <Button
              className="w-full py-7 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(253,140,0,0.2)] hover:shadow-[0_0_25px_rgba(253,140,0,0.3)] transition-all disabled:opacity-50 text-lg"
              disabled={!isValidAmount || isPending}
              onClick={handleInvest}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Investing in {bond.bondId}...
                </>
              ) : (
                "Invest Now"
              )}
            </Button>
          </div>
        )}
      </CardContent>

      {loggedIn && (
        <CardFooter className="bg-[#1C1A21]/50 border-t border-white/5 py-4">
          <p className="text-[11px] text-muted-foreground leading-tight">
            ✨ <span className="text-green-400 font-semibold">Gasless Investment</span> -
            You are investing in <strong>{bond.bondName}</strong>. The backend sponsors your transaction.
          </p>
        </CardFooter>
      )}
    </Card>
  )
}

