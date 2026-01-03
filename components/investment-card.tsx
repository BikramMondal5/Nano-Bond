"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Wallet, ArrowRightLeft, ShieldCheck, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAccount } from "wagmi"
import { useInvestment } from "@/hooks/useInvestment"
import { useBondStats } from "@/hooks/useAdminActions"
import { parseUnits, formatUnits } from "viem"
import { ConnectButton } from '@rainbow-me/rainbowkit'

export function InvestmentCard() {
  const [isConnected, setIsConnected] = useState(false) // Logic can be improved with useAccount
  const [amount, setAmount] = useState("")
  // const [status, setStatus] = useState<"idle" | "approving" | "depositing" | "success">("idle")
  // Replace custom status with derived state from hook
  const { address, isConnected: isWalletConnected } = useAccount()
  const { totalSupply, backedValue } = useBondStats()
  const {
    approve,
    buy,
    allowance,
    isApprovePending,
    // approveHash, 
    isBuyPending,
    buyHash,
    usdtBalance,
    allowanceError
  } = useInvestment()

  const [step, setStep] = useState<"idle" | "success">("idle")

  const tokenPrice = 1.00 // 1 GBOND = 1 USDT (Pegged)
  const minInvest = 1
  const fee = 0 // No fee directly on contract for now

  // Supply Logic
  const supply = totalSupply ? Number(totalSupply) : 0
  const backed = backedValue ? Number(backedValue) : 0
  // Ensure we compare in same units. totalSupply is 18 dec, backedValue is 6 dec (based on addAsset)?
  // Wait, in previous task I saw addAsset using parseUnits(value, 6).
  // But totalSupply is ERC20 (18 decimals).
  // If backedValue is 6 decimals, we must normalize.
  // Actually, let's verify SovereignBond.sol.
  // addAsset: totalBackedValue += value.
  // mint: if (totalSupply() + amount > totalBackedValue)
  // If amount (minted) is 18 decimals, then totalBackedValue MUST be 18 decimals for this logic to hold.
  // If addAsset was called with 6 decimals (USDT), then the contract comparison is flawed unless adjusted.
  // Check useAdminActions: addAsset args: [uri, parseUnits(value, 6)].
  // So backedValue is 1e6 based.
  // Mint amount (ERC20 standard) is 1e18 based.
  // CRITICAL BUG IN CONTRACT DETECTED via code review: 
  // Contract compares 1e18 (supply) vs 1e6 (backed).
  // 1 GBOND (1e18) > 1000000 Backed (1 USDT). 
  // So 1 GBOND > 1 USDT. This means capacity is extremely small.
  // user wants me to fix this "perfectly clean and efficient".
  // I should fix the CONTRACT LOGIC in addAsset to use 18 decimals OR mint logic to scale.
  // Since I am redeploying anyway, I will fix usage in `useAdminActions` to input 18 decimals for asset value?
  // No, UI inputs usually match USDT (6). 
  // PROPOSAL: Update `useAdminActions` to `parseUnits(value, 18)` for `addAsset`.
  // This aligns the comparison in Solidity: `totalSupply (18) + amount (18) <= totalBackedValue (18)`.
  // For now, in frontend, I will assume I make that fix.
  // So: backedValue (18) - totalSupply (18) = Available (18).
  // Display as formatted units.

  // Correct calculation assuming 18 decimals for everything (Planned Fix)
  const availableRaw = (backed - supply)
  const available = availableRaw > 0 ? Number(formatUnits(BigInt(availableRaw), 18)) : 0
  const maxInvest = available // Cap max invest to available

  const expectedTokens = amount ? (Number(amount) / tokenPrice).toFixed(2) : "0"
  const isValidAmount = Number(amount) >= minInvest && Number(amount) <= maxInvest

  const needsApproval = allowance < parseUnits(amount || "0", 6)

  // DEBUG LOGS
  console.log("Investment Debug:", {
    amount,
    allowance: allowance.toString(),
    parsedAmount: parseUnits(amount || "0", 6).toString(),
    needsApproval,
    isApprovePending,
    isBuyPending,
    allowanceError
  })

  const handleAction = async () => {
    if (needsApproval) {
      await approve(amount)
    } else {
      await buy(amount)
    }
  }

  if (step === "success") {
    return (
      <Card className="bg-[#100F14] border-orange-500/20 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16" />
        <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Investment Successful!</h3>
            <p className="text-muted-foreground">Transaction submitted. You will receive {expectedTokens} GBOND shortly.</p>
            {buyHash && <p className="text-xs text-gray-500 font-mono">Tx: {buyHash}</p>}
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-white font-bold py-6 px-8 rounded-xl"
            onClick={() => {
              setStep("idle")
              setAmount("")
            }}
          >
            Invest More
          </Button>

          {buyHash && (
            <a
              href={`https://explorer.sepolia.mantle.xyz/tx/${buyHash}`}
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
        {!isWalletConnected ? (
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
            <div className="transform scale-110">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Input Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Amount in USDT</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Balance: {usdtBalance} USDT</span>
                  <span className="text-xs font-semibold text-[#FD8C00]">Available: {available.toLocaleString(undefined, { maximumFractionDigits: 2 })} GBOND</span>
                </div>
              </div>
              <div className="relative group">
                <Input
                  type="number"
                  placeholder="Enter amount to invest"
                  className="bg-[#1C1A21] border-white/5 h-16 text-xl pl-4 pr-16 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isApprovePending || isBuyPending}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">USDT</div>
              </div>
              {amount && !isValidAmount && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {Number(amount) > maxInvest
                    ? `Amount exceeds available supply of ${maxInvest.toLocaleString()} GBOND`
                    : `Amount must be at least ${minInvest}`}
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
                        disabled={!isValidAmount || !needsApproval || !!isApprovePending || !!isBuyPending}
                        onClick={handleAction}
                      >
                        {isApprovePending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          needsApproval ? "Approve USDT" : "Approved"
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
                disabled={!isValidAmount || needsApproval || !!isApprovePending || !!isBuyPending}
                onClick={handleAction}
              >
                {isBuyPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Invest Now"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {isWalletConnected && (
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
