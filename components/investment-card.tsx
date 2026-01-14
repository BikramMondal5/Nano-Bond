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
import { toast } from "react-toastify"
import type { IBond } from "@/lib/models/Bond"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useContentTranslation } from "@/hooks/useContentTranslation"

interface InvestmentCardProps {
  bond: IBond;
}

export function InvestmentCard({ bond }: InvestmentCardProps) {
  const content = useContentTranslation({
    success_title: "Investment Successful!",
    success_msg: "You have received",
    success_msg_suffix: "tokens.",
    invest_more: "Invest More",
    view_tx: "View Transaction on Explorer",
    purchase: "Purchase",
    gasless: "Gasless",
    desc_default: "One-click investment with zero gas fees - backend pays for you!",
    wallet_not_connected: "Wallet Not Connected",
    connect_prompt: "Connect your wallet to start investing in Government Bonds.",
    balance_label: "Your USDT Balance",
    faucet_btn: "Faucet",
    faucet_tooltip: "Get 1000 test USDT",
    invest_label: "Amount to Invest",
    limit_label: "Limit",
    min_placeholder: "Min",
    insufficient_balance: "Insufficient balance. Your balance:",
    exceeds_limit: "Amount exceeds max limit",
    min_invest_error: "Minimum investment is",
    receive_label: "You will receive",
    zero_gas: "Zero Gas Fee",
    rate_label: "Rate",
    maturity_label: "Maturity",
    invest_now: "Invest Now",
    investing_in: "Investing in",
    gasless_note: "Gasless Investment",
    gasless_desc: "You are investing in",
    gasless_desc_suffix: "The backend sponsors your transaction."
  })

  const [amount, setAmount] = useState("")
  const { walletAddress, loggedIn } = useWeb3AuthContext()
  const { totalSupply, backedValue } = useBondStats(bond.contractAddress)
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

  const [selectedNetwork, setSelectedNetwork] = useState<string>('mantle')

  const NETWORKS = [
    { id: 'mantle', name: 'Mantle Sepolia', icon: '🔷' },
    { id: 'ethereum', name: 'Ethereum Sepolia', icon: '⟠' },
    { id: 'arbitrum', name: 'Arbitrum Sepolia', icon: '🔵' },
    { id: 'polygon', name: 'Polygon Amoy', icon: '🟣' },
    { id: 'scroll', name: 'Scroll Sepolia', icon: '📜' }
  ]

  // Reset state when bond changes
  useEffect(() => {
    reset()
    setAmount("")
  }, [bond.bondId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch balance on mount and after actions
  useEffect(() => {
    if (walletAddress && loggedIn) {
      getBalance(selectedNetwork).then(setUsdtBalance)
    }
  }, [walletAddress, loggedIn, isSuccess, selectedNetwork])

  const handleNetworkChange = (network: string) => {
    console.log(`[Card] Network changed to: ${network}`)
    setSelectedNetwork(network)
    setUsdtBalance("0") // Reset to 0 while loading

    // Fetch balance for new network immediately
    if (walletAddress && loggedIn) {
      getBalance(network).then(balance => {
        console.log(`[Card] Balance loaded for ${network}: ${balance}`)
        setUsdtBalance(balance)
      })
    }
  }

  const tokenPrice = 1.00 // 1 GBOND = 1 USDT
  const minInvest = bond.minInvestment || 1

  // Use on-chain logic if available, else fallback to bond metadata
  // Ideally, we'd fetch stats per bond address
  const maxInvest = bond.maxSubscription || 1000000

  const expectedTokens = amount ? (Number(amount) / tokenPrice).toFixed(2) : "0"
  const isValidAmount = Number(amount) >= minInvest && Number(amount) <= maxInvest && Number(amount) <= Number(usdtBalance)

  const handleInvest = async () => {
    const result = await invest(amount, bond.bondId, selectedNetwork)

    // Show appropriate message based on network
    if (result?.isCrossChain) {
      toast.info('Cross-chain investment initiated! Bonds will arrive in ~5-10 minutes.')
    }
  }

  const handleFaucet = async () => {
    try {
      await requestFaucet(1000, selectedNetwork)

      // Wait for blockchain to index the transaction
      toast.info('Waiting for transaction to be indexed...')
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Force refresh balance
      console.log(`[Card] Refreshing balance for ${selectedNetwork}`)
      const newBalance = await getBalance(selectedNetwork)
      console.log(`[Card] New balance: ${newBalance}`)
      setUsdtBalance(newBalance)

    } catch (error) {
      console.error('[Card] Faucet error:', error)
    }
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
            <h3 className="text-2xl font-bold text-white">{content.success_title}</h3>
            <p className="text-muted-foreground">{content.success_msg} {expectedTokens} {bond.bondName} {content.success_msg_suffix}</p>
            {txHash && <p className="text-xs text-gray-500 font-mono">Tx: {txHash}</p>}
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-white font-bold py-6 px-8 rounded-xl"
            onClick={() => {
              reset()
              setAmount("")
            }}
          >
            {content.invest_more}
          </Button>
          {txHash && (
            <a
              href={`https://explorer.sepolia.mantle.xyz/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline flex items-center gap-1"
            >
              {content.view_tx}
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
              {content.purchase} {bond.bondName}
            </CardTitle>
            <div className="text-xs text-muted-foreground font-mono bg-white/5 px-2 py-0.5 rounded w-fit">
              ID: {bond.bondId}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-green-500 uppercase tracking-wider">{content.gasless}</span>
          </div>
        </div>
        <CardDescription className="text-muted-foreground text-sm pt-2">
          {bond.description || content.desc_default}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!loggedIn ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 bg-muted/20 rounded-2xl flex items-center justify-center border border-white/5">
              <Wallet className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-lg font-medium text-white">{content.wallet_not_connected}</h4>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                {content.connect_prompt}
              </p>
            </div>
            <div className="transform scale-110">
              <Web3AuthConnectButton />
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Network Selector + Balance Section */}
            <div className="space-y-3">
              {/* Network Selector */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Select Network</label>
              </div>
              <Select value={selectedNetwork} onValueChange={handleNetworkChange}>
                <SelectTrigger className="bg-[#1C1A21] border-white/5 h-12">
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((network) => (
                    <SelectItem key={network.id} value={network.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{network.icon}</span>
                        <span>{network.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Balance Display */}
              <div className="flex items-center justify-between p-4 bg-[#1C1A21] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    USDT Balance on {NETWORKS.find(n => n.id === selectedNetwork)?.name}
                  </div>
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
                          {content.faucet_btn}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Get 1000 test USDT on {selectedNetwork.toUpperCase()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Input Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">{content.invest_label}</label>
                <span className="text-xs font-semibold text-[#FD8C00]">
                  {content.limit_label}: {maxInvest.toLocaleString()} USDT
                </span>
              </div>
              <div className="relative group">
                <Input
                  type="number"
                  placeholder={`${content.min_placeholder} ${minInvest} USDT`}
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
                    ? `${content.insufficient_balance} ${Number(usdtBalance).toFixed(2)}`
                    : Number(amount) > maxInvest
                      ? content.exceeds_limit
                      : `${content.min_invest_error} ${minInvest} USDT`}
                </p>
              )}
            </div>

            {/* Conversion Result */}
            <div className="p-4 bg-[#1C1A21] rounded-xl border border-white/5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-sm text-muted-foreground">{content.receive_label}</span>
                <div className="flex items-center gap-1.5 text-green-500 text-xs font-bold uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {content.zero_gas}
                </div>
              </div>
              <div className="flex items-end gap-2 relative z-10">
                <span className="text-3xl font-bold text-white leading-none">{expectedTokens}</span>
                <span className="text-lg font-medium text-muted-foreground mb-0.5">GBOND</span>
              </div>
              <div className="pt-3 border-t border-white/5 flex flex-col gap-1.5 text-xs text-muted-foreground relative z-10">
                <div className="flex justify-between">
                  <span>{content.rate_label}</span>
                  <span className="text-white">1 GBOND = {tokenPrice} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span>{content.maturity_label}</span>
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
                  {content.investing_in} {bond.bondId}...
                </>
              ) : (
                content.invest_now
              )}
            </Button>
          </div>
        )}
      </CardContent>

      {loggedIn && (
        <CardFooter className="bg-[#1C1A21]/50 border-t border-white/5 py-4">
          <p className="text-[11px] text-muted-foreground leading-tight">
            ✨ <span className="text-green-400 font-semibold">{content.gasless_note}</span> -
            {content.gasless_desc} <strong>{bond.bondName}</strong>. {content.gasless_desc_suffix}
          </p>
        </CardFooter>
      )}
    </Card>
  )
}

