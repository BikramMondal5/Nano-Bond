"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Wallet, ArrowRightLeft, ShieldCheck, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function InvestmentCard() {
  const [isConnected, setIsConnected] = useState(false)
  const [amount, setAmount] = useState("")
  const [status, setStatus] = useState<"idle" | "approving" | "depositing" | "success">("idle")
  const [isVerified, setIsVerified] = useState(true) // Mock verification status

  const tokenPrice = 1.08 // 1 GBOND = 1.08 USDT
  const minInvest = 100
  const maxInvest = 50000
  const fee = 0.5 // 0.5 USDT

  const expectedTokens = amount ? (Number(amount) / tokenPrice).toFixed(2) : "0"
  const isValidAmount = Number(amount) >= minInvest && Number(amount) <= maxInvest

  const handleConnect = () => {
    setIsConnected(true)
  }

  const handleAction = async () => {
    if (status === "idle") {
      setStatus("approving")
      setTimeout(() => setStatus("depositing"), 2000)
      setTimeout(() => setStatus("success"), 4000)
    }
  }

  if (status === "success") {
    return (
      <Card className="bg-[#100F14] border-orange-500/20 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16" />
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Investment Successful!</h3>
            <p className="text-muted-foreground">You have successfully purchased {expectedTokens} GBOND tokens.</p>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-white font-bold py-6 px-8 rounded-xl"
            onClick={() => {
              setStatus("idle")
              setAmount("")
            }}
          >
            Invest More
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#100F14] border-orange-500/20 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16" />

      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-white">Purchase GBOND</CardTitle>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Asset Verified</span>
          </div>
        </div>
        <CardDescription className="text-muted-foreground text-sm">
          Secured by on-chain Government Bond reserves.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center border border-white/5">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-lg font-medium text-white">Wallet Not Connected</h4>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Please connect your Web3 wallet to start investing in Government Bonds.
              </p>
            </div>
            <Button
              className="bg-primary hover:bg-primary/90 text-white font-bold py-6 px-12 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleConnect}
            >
              Connect Wallet
            </Button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Input Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Amount in USDT</label>
                <span className="text-xs text-muted-foreground">Balance: 12,450.00 USDT</span>
              </div>
              <div className="relative group">
                <Input
                  type="number"
                  placeholder="Enter amount to invest"
                  className="bg-[#1C1A21] border-white/5 h-16 text-xl pl-4 pr-16 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={status !== "idle"}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">USDT</div>
              </div>
              {amount && !isValidAmount && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Amount must be between ${minInvest} and ${maxInvest.toLocaleString()}
                </p>
              )}
            </div>

            {/* Conversion Result */}
            <div className="p-4 bg-[#1C1A21] rounded-xl border border-white/5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-sm text-muted-foreground">You will receive</span>
                <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Live Rate
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
                  <span>Service Fee</span>
                  <span className="text-white">{fee} USDT</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Button
                        variant="outline"
                        className="w-full py-7 border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl disabled:opacity-50"
                        disabled={!isValidAmount || status !== "idle" || status === "depositing"}
                        onClick={handleAction}
                      >
                        {status === "approving" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          "Approve USDT"
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Grant permission to use your USDT</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                className="w-full py-7 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(253,140,0,0.2)] hover:shadow-[0_0_25px_rgba(253,140,0,0.3)] transition-all disabled:opacity-50"
                disabled={!isValidAmount || status === "idle" || status === "approving"}
                onClick={handleAction}
              >
                {status === "depositing" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Invest Now"
                )}
              </Button>
            </div>

            {!isVerified && (
              <Alert className="bg-destructive/10 border-destructive/20 text-destructive py-2">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle className="text-xs">Action Required</AlertTitle>
                <AlertDescription className="text-[11px]">
                  Account verification pending. Please complete KYC to invest.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>

      {isConnected && (
        <CardFooter className="bg-[#1C1A21]/50 border-t border-white/5 py-4">
          <p className="text-[11px] text-muted-foreground leading-tight">
            Investing in digital assets involves risk. By clicking Invest Now, you agree to our
            <span className="text-primary hover:underline cursor-pointer ml-1">Terms of Service</span>.
          </p>
        </CardFooter>
      )}
    </Card>
  )
}
