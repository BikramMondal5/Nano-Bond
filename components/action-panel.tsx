"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRightLeft, Info } from "lucide-react"

interface ActionPanelProps {
  bondStatus: string
}

export function ActionPanel({ bondStatus }: ActionPanelProps) {
  const [amount, setAmount] = useState("")
  const conversionRate = 0.909 // 1 USDT = ~0.909 GBOND if price is 1.1

  const gbondsReceived = amount ? (Number.parseFloat(amount) * conversionRate).toFixed(2) : "0.00"

  return (
    <Card className="bg-[#100F14] border-primary/20 shadow-2xl shadow-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="text-[#E5E7EB] text-xl font-bold flex items-center gap-2">Manage Investment</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#1C1A21] mb-6">
            <TabsTrigger
              value="buy"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Buy
            </TabsTrigger>
            <TabsTrigger
              value="redeem"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Redeem
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#6B7280] uppercase tracking-wider flex justify-between">
                Amount in USDT
                <span>Balance: 5,420.00</span>
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
                You will receive (est.)
              </label>
              <div className="bg-[#1C1A21] border border-white/5 rounded-md h-14 flex items-center px-4 justify-between">
                <span className="text-lg font-bold text-[#E5E7EB]">{gbondsReceived}</span>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">GBOND</span>
              </div>
            </div>

            <Button className="w-full h-14 bg-gradient-to-r from-[#FD8C00] to-[#FFAB40] hover:from-[#E67E00] hover:to-[#FD8C00] text-black font-bold text-lg shadow-lg shadow-primary/20 transition-all duration-300">
              Buy GBOND Instantly
            </Button>

            <p className="text-[10px] text-[#6B7280] text-center leading-relaxed">
              By clicking Buy, you agree to the Bond Terms and Conditions. Yield is calculated daily and accrued to your
              balance.
            </p>
          </TabsContent>

          <TabsContent value="redeem" className="space-y-6">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex gap-3">
              <Info className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm text-[#9CA3AF]">
                Redemption is currently only available for matured bonds. This bond matures in 187 days.
              </p>
            </div>

            <Button
              disabled
              className="w-full h-14 bg-muted text-muted-foreground font-bold text-lg cursor-not-allowed"
            >
              Redeem GBOND
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
