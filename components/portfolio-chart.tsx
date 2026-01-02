"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

const data = [
  { name: "Week 1", value: 8200 },
  { name: "Week 2", value: 8500 },
  { name: "Week 3", value: 8400 },
  { name: "Week 4", value: 8900 },
  { name: "Week 5", value: 9200 },
  { name: "Week 6", value: 9800 },
  { name: "Week 7", value: 10500 },
]

export function PortfolioChart() {
  return (
    <Card className="bg-[#100F14] border-white/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-[#E5E7EB] text-xl font-bold">Portfolio Performance</CardTitle>
          <p className="text-sm text-[#9CA3AF]">Value Growth Over Time</p>
        </div>
        <div className="flex gap-2">
          {["1W", "1M", "3M", "ALL"].map((t) => (
            <button
              key={t}
              className={`text-xs px-3 py-1 rounded-md border transition-all ${t === "1M" ? "bg-primary/20 border-primary text-primary" : "border-white/5 text-[#6B7280] hover:text-[#E5E7EB]"}`}
            >
              {t}
            </button>
          ))}
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
            />
            <Area type="monotone" dataKey="value" stroke="#FD8C00" strokeWidth={3} fill="url(#chartGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
