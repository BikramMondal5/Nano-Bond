"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

const data = [
  { day: 0, price: 1.0 },
  { day: 30, price: 1.015 },
  { day: 60, price: 1.032 },
  { day: 90, price: 1.048 },
  { day: 120, price: 1.065 },
  { day: 150, price: 1.082 },
  { day: 180, price: 1.1 },
]

export function YieldChart() {
  return (
    <Card className="bg-[#100F14] border-white/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[#E5E7EB] text-xl font-bold">Yield Growth</CardTitle>
        <div className="flex gap-2">
          {["1M", "3M", "6M", "YTD", "ALL"].map((time) => (
            <button
              key={time}
              className={`text-xs px-2 py-1 rounded ${time === "6M" ? "bg-primary/20 text-primary border border-primary/30" : "text-[#6B7280] hover:text-[#E5E7EB]"}`}
            >
              {time}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="h-[350px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FD8C00" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FD8C00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A2A" />
            <XAxis
              dataKey="day"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `Day ${value}`}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
              domain={["dataMin - 0.01", "dataMax + 0.01"]}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1C1A21", border: "1px solid #2A2A2A", borderRadius: "8px" }}
              itemStyle={{ color: "#FD8C00" }}
              labelStyle={{ color: "#9CA3AF" }}
              labelFormatter={(value) => `Day ${value}`}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#FD8C00"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorPrice)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
