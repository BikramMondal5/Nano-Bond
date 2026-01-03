"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { usePortfolioData } from "@/hooks/usePortfolioData"
import { useMemo } from "react"

export function PortfolioChart() {
  const { balance } = usePortfolioData()

  const data = useMemo(() => {
    const bal = Number(balance || 0)
    const rate = 0.085
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // Generate 12 months of projected growth
    return months.map((month, i) => {
      // Simple linear projection for visualization: Value = Bal + (Bal * Rate * FractionOfYear)
      const projectedValue = bal + (bal * rate * ((i) / 11)) // 0 to 1 scaling over 12 points
      return {
        name: month,
        value: Number(projectedValue.toFixed(2))
      }
    })
  }, [balance])

  return (
    <Card className="bg-[#100F14] border-white/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-[#E5E7EB] text-xl font-bold">Projected Value Growth</CardTitle>
          <p className="text-sm text-[#9CA3AF]">Based on 8.5% APY Projection</p>
        </div>
      </CardHeader>
      <CardContent className="h-[300px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FD8C00" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FD8C00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A2A" />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1C1A21",
                border: "1px solid rgba(253, 140, 0, 0.2)",
                borderRadius: "12px",
              }}
              itemStyle={{ color: "#FD8C00" }}
              formatter={(value) => [`$${value}`, "Projected Value"]}
            />
            <Area type="monotone" dataKey="value" stroke="#FD8C00" strokeWidth={3} fill="url(#chartGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
