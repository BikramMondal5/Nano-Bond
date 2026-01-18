"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { useState, useEffect } from "react"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function MarketAnalysisChart() {
    const content = useContentTranslation({
        title: "Market Analysis",
        subtitle: "30-Day US Treasury Bond Price Trends",
        tooltip_label: "Price"
    })

    // Simulated historical data generator
    // Use useEffect to avoid hydration mismatch (random data differs on server vs client)
    const [data, setData] = useState<any[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const points = []
        const today = new Date()
        const basePrice = 98.50

        for (let i = 30; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)

            // Simulate market volatility
            // Random walk with mean reversion
            const randomChange = (Math.random() - 0.5) * 0.4
            const trend = Math.sin(i / 5) * 0.2 // Add some wave pattern

            const price = basePrice + randomChange + trend

            points.push({
                name: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                value: Number(price.toFixed(2)),
                yield: (4.5 - (price - 98) * 0.5).toFixed(2) // Inverse relation to price roughly
            })
        }
        setData(points)
    }, [])

    if (!mounted) return null; // Avoid rendering until client-side data is ready

    return (
        <Card className="bg-[#100F14] border-white/5 w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-[#E5E7EB] text-xl font-bold">{content.title}</CardTitle>
                    <p className="text-sm text-[#9CA3AF] self-start">{content.subtitle}</p>
                </div>
                <div className="flex gap-2">
                    <span className="flex items-center text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">
                        +1.2% (30d)
                    </span>
                </div>
            </CardHeader>
            <CardContent className="h-[400px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A2A" />
                        <XAxis
                            dataKey="name"
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `$${v}`}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1C1A21",
                                border: "1px solid rgba(59, 130, 246, 0.2)", // Blue border
                                borderRadius: "12px",
                                color: "#E5E7EB"
                            }}
                            itemStyle={{ color: "#3B82F6" }}
                            formatter={(value: any, name: any, props: any) => [
                                <div key="price" className="flex flex-col gap-1">
                                    <span className="font-bold text-white">${value}</span>
                                    <span className="text-xs text-gray-400">Yield: {props.payload.yield}%</span>
                                </div>,
                                ""
                            ]}
                            labelStyle={{ color: "#9CA3AF", marginBottom: "0.5rem" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#3B82F6" // Blue for Market Analysis to differentiate from Portfolio (Orange)
                            strokeWidth={3}
                            fill="url(#marketGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
