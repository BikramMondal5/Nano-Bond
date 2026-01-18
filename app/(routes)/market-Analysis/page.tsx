"use client"

import { MarketAnalysisChart } from "@/components/market-analysis-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, TrendingUp, Activity } from "lucide-react"

export default function TransactionsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0A] p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
                    Market Analysis
                </h1>
                <p className="text-gray-400 mt-2">
                    Real-time government bond performance and historical trends
                </p>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#100F14] border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Market Vol</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">$24.5M</div>
                        <p className="text-xs text-green-500 flex items-center mt-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +2.4% from yesterday
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-[#100F14] border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Avg APY</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">4.2%</div>
                        <p className="text-xs text-gray-400 mt-1">
                            Across all active bonds
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-[#100F14] border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Avg Face Value</CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">$0.98</div>
                        <p className="text-xs text-orange-500 flex items-center mt-1">
                            -0.1% (Buying Opportunity)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-3">
                    <MarketAnalysisChart />
                </div>
            </div>

            {/* Recent Activity/News Section Placeholders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-[#100F14] border-white/5">
                    <CardHeader>
                        <CardTitle className="text-white">Market News</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-start gap-3 border-b border-white/5 pb-3 last:border-0">
                                    <div className="min-w-[4px] h-full bg-blue-500/20 rounded-full" />
                                    <div>
                                        <h4 className="text-sm font-medium text-white hover:text-blue-400 cursor-pointer">
                                            US Treasury Yields Stabilize amid Fed comments
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1">2 hours ago • Bloomberg</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#100F14] border-white/5">
                    <CardHeader>
                        <CardTitle className="text-white">Top Movers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-white">US 10Y Note</span>
                                <span className="text-green-500 font-mono">+0.45%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white">US 2Y Note</span>
                                <span className="text-red-500 font-mono">-0.12%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white">Global Sov Bond ETF</span>
                                <span className="text-green-500 font-mono">+1.03%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
