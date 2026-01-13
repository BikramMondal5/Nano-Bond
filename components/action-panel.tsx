"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRightLeft, Info } from "lucide-react"
import { useContentTranslation } from "@/hooks/useContentTranslation"

interface ActionPanelProps {
  bondStatus: string
}

export function ActionPanel({ bondStatus }: ActionPanelProps) {
  const content = useContentTranslation({
    title: "Manage Investment",
    tab_buy: "Buy",
    tab_redeem: "Redeem",
    lbl_amount: "Amount in USDT",
    lbl_balance: "Balance: 5,420.00",
    lbl_receive: "You will receive (est.)",
    btn_buy: "Buy GBOND Instantly",
    btn_redeem: "Redeem GBOND",
    disclaimer: "By clicking Buy, you agree to the Bond Terms and Conditions. Yield is calculated daily and accrued to your balance.",
    redeem_info: "Redemption is currently only available for matured bonds. This bond matures in 187 days."
  })

  const searchParams = useSearchParams()
  const initialAmount = searchParams.get('investAmount') || ""
  const [amount, setAmount] = useState(initialAmount)
  const conversionRate = 0.909 // 1 USDT = ~0.909 GBOND if price is 1.1

  const gbondsReceived = amount ? (Number.parseFloat(amount) * conversionRate).toFixed(2) : "0.00"

  return (
    <Card id="investment-panel" className="bg-[#100F14] border-primary/20 shadow-2xl shadow-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="text-[#E5E7EB] text-xl font-bold flex items-center gap-2">{content.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#1C1A21] mb-6">
            <TabsTrigger
              value="buy"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {content.tab_buy}
            </TabsTrigger>
            <TabsTrigger
              value="redeem"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {content.tab_redeem}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wider flex justify-between">
                {content.lbl_amount}
                <span>{content.lbl_balance}</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-[#1C1A21] border-white/10 h-14 text-lg focus-visible:ring-primary pl-4 pr-20"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#0A0A0A] px-2 py-1 rounded border border-white/5">
                  <span className="text-xs font-bold text-[#E5E7EB]">USDT</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="bg-primary/10 rounded-full p-2">
                <ArrowRightLeft className="w-4 h-4 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                {content.lbl_receive}
              </label>
              <div className="bg-[#1C1A21] border border-white/5 rounded-md h-14 flex items-center px-4 justify-between">
                <span className="text-lg font-bold text-[#E5E7EB]">{gbondsReceived}</span>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">GBOND</span>
              </div>
            </div>

            <Button className="w-full h-14 bg-gradient-to-r from-[#FD8C00] to-[#FFAB40] hover:from-[#E67E00] hover:to-[#FD8C00] text-black font-bold text-lg shadow-lg shadow-primary/20 transition-all duration-300">
              {content.btn_buy}
            </Button>

            <p className="text-[10px] text-[#6B7280] text-center leading-relaxed">
              {content.disclaimer}
            </p>
          </TabsContent>

          <TabsContent value="redeem" className="space-y-6">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex gap-3">
              <Info className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm text-[#9CA3AF]">
                {content.redeem_info}
              </p>
            </div>

            <Button
              disabled
              className="w-full h-14 bg-muted text-muted-foreground font-bold text-lg cursor-not-allowed"
            >
              {content.btn_redeem}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
