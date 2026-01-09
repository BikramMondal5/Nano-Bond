"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Wallet, ArrowRightLeft, Clock, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { useWeb3AuthContext } from "@/components/providers"
import { useInvestment } from "@/hooks/useInvestment"
import { usePortfolioData } from "@/hooks/usePortfolioData"
import { useBondStats } from "@/hooks/useAdminActions"
import { Web3AuthConnectButton } from "@/components/web3auth-connect-button"

export function RedemptionCard() {
  const { loggedIn: isConnected } = useWeb3AuthContext()
  const { balance, claimable } = usePortfolioData()
  const { maturityDate } = useBondStats()
  const { redeem, claim, isBuyPending: isRedeemPending, isBuyConfirmed: isRedeemConfirmed } = useInvestment() // Reusing hooks

  const [amount, setAmount] = useState("")
  // const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  // Using hook state instead

  // Real Data
  const gbondBalance = balance ? Number(balance) : 0
  const claimableYield = claimable ? Number(claimable) : 0
  const tokenPrice = 1.00 // 1 GBOND = 1 USDT (Pegged/Redeemable)

  // Check Maturity
  const now = Math.floor(Date.now() / 1000)
  const isMatured = maturityDate ? Number(maturityDate) <= now : false

  const expectedUsdt = amount ? (Number(amount) * tokenPrice).toFixed(2) : "0"
  const isValidAmount = Number(amount) > 0 && Number(amount) <= gbondBalance

  const handleAction = async () => {
    // setStatus("processing")
    await redeem(amount)
  }

  // Effect to handle success via hook
  const [showSuccess, setShowSuccess] = useState(false)
  useEffect(() => {
    if (isRedeemConfirmed) {
      setShowSuccess(true)
    }
  }, [isRedeemConfirmed])

  if (showSuccess) {
    return (
      <Card className="bg-[#100F14] border-orange-500/20 shadow-2xl overflow-hidden">
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Redemption Successful!</h3>
            <p className="text-muted-foreground">
              You have successfully redeemed {amount} GBOND for {expectedUsdt} USDT.
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="border-white/10 bg-transparent" onClick={() => { setShowSuccess(false); setAmount(""); }}>
              Back to Dashboard
            </Button>
            <Button className="bg-primary hover:bg-primary/90">View Transaction</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#100F14] border-orange-500/20 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16" />

      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-white">Redeem Tokens</CardTitle>
          {!isMatured && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">Awaiting Maturity</span>
            </div>
          )}
        </div>
        <CardDescription className="text-muted-foreground text-sm">
          Convert your matured GBOND tokens back to USDT instantly.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-6 border-2 border-dashed border-white/5 rounded-2xl">
            <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center border border-white/5">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-lg font-medium text-white italic">Wallet Not Connected</h4>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Please connect your wallet to view your balance and redeem tokens.
              </p>
            </div>
            <div className="transform scale-110">
              <Web3AuthConnectButton />
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Claimable Yield Section */}
            {claimableYield > 0 && (
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-400 font-medium mb-1">Unclaimed Interest</div>
                  <div className="text-2xl font-bold text-white flex items-center gap-2">
                    {claimableYield.toFixed(2)} USDT
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => claim()}
                  disabled={isRedeemPending}
                  className="bg-green-600 hover:bg-green-700 text-white border-none"
                >
                  {isRedeemPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Claim Now"}
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-[#1C1A21] rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Connected Wallet</p>
                  <p className="text-sm font-mono text-white">0xAb...1234</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">GBOND Balance</p>
                <p className="text-sm font-bold text-primary">{gbondBalance.toLocaleString()} GBOND</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Amount to Redeem</label>
                <button
                  onClick={() => setAmount(gbondBalance.toString())}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Max Amount
                </button>
              </div>
              <div className="relative group">
                <Input
                  type="number"
                  placeholder="0.00"
                  className="bg-[#1C1A21] border-white/5 h-16 text-xl pl-4 pr-20 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all font-serif"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">GBOND</div>
              </div>
            </div>

            <div className="p-4 bg-[#1C1A21] rounded-xl border border-white/5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <span className="text-sm text-muted-foreground">Estimated USDT Return</span>
                <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Market Rate
                </div>
              </div>
              <div className="flex items-end gap-2 relative z-10">
                <span className="text-3xl font-bold text-white leading-none font-serif">{expectedUsdt}</span>
                <span className="text-lg font-medium text-muted-foreground mb-0.5">USDT</span>
              </div>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    <Button
                      className="w-full py-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(253,140,0,0.2)] hover:shadow-[0_0_25px_rgba(253,140,0,0.3)] transition-all disabled:opacity-50 text-lg uppercase tracking-widest italic"
                      disabled={!isValidAmount || !isMatured || isRedeemPending}
                      onClick={handleAction}
                    >
                      {isRedeemPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Redeem GBOND"
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!isMatured && (
                  <TooltipContent className="bg-[#1C1A21] border-white/10 text-white max-w-[200px] text-center">
                    <p className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      Redemption is enabled only after the bond matures.
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
