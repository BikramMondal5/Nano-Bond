"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

const data = [
  { date: "Oct 01", rewards: 120 },
  { date: "Oct 15", rewards: 280 },
  { date: "Nov 01", rewards: 450 },
  { date: "Nov 15", rewards: 620 },
  { date: "Dec 01", rewards: 890 },
  { date: "Dec 15", rewards: 1120 },
  { date: "Jan 01", rewards: 1350 },
]

export function RewardsChart() {
  return (
    <Card className="bg-[#100F14] border-white/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[#E5E7EB] text-xl font-bold">Earned Rewards</CardTitle>
        <div className="flex gap-2">
          {["1M", "3M", "6M", "ALL"].map((time) => (
            <button
              key={time}
              className={`text-xs px-3 py-1 rounded-md transition-all ${
                time === "3M"
                  ? "bg-primary text-primary-foreground font-semibold shadow-[0_0_15px_rgba(253,140,0,0.3)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="h-[300px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRewards" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FD8C00" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FD8C00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1C1C21" />
            <XAxis dataKey="date" stroke="#4B5563" fontSize={11} tickLine={false} axisLine={false} dy={10} />
            <YAxis
              stroke="#4B5563"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1C1A21",
                border: "1px solid #2A2A2A",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
              itemStyle={{ color: "#FD8C00" }}
              labelStyle={{ color: "#9CA3AF", marginBottom: "4px" }}
            />
            <Area
              type="monotone"
              dataKey="rewards"
              stroke="#FD8C00"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRewards)"
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
