
import { Suspense } from "react"
import { BondHero } from "@/components/bond-hero"
import { BondStats } from "@/components/bond-stats"
import { YieldChart } from "@/components/yield-chart"
import { ActionPanel } from "@/components/action-panel"
import { AssetVerification } from "@/components/asset-verification"
import { BondDetailedInfo } from "@/components/bond-detailed-info"
import connectDB from "@/lib/mongodb"
import Bond from "@/lib/models/Bond"
import { notFound } from "next/navigation"
import { differenceInDays } from "date-fns"

async function getBond(bondId: string) {
    try {
        await connectDB()
        const bond = await Bond.findOne({ bondId }).lean()
        if (!bond) return null
        // Serialize
        return JSON.parse(JSON.stringify(bond))
    } catch (error) {
        console.error("Failed to fetch bond:", error)
        return null
    }
}

export default async function MyBondDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const bond = await getBond(id)

    if (!bond) {
        notFound()
    }

    // Transform DB data to UI format
    const bondData = {
        name: bond.bondName,
        status: "verified", // Assume verified for DB records
        yieldRate: `${bond.couponRate}%`,
        maturityDays: differenceInDays(new Date(bond.maturityDate), new Date()),
        currentPrice: 1.0, // Assuming par value or fetch from market logic if exists
        totalSupply: (bond.maxSubscription).toLocaleString(),
        totalVault: (bond.maxSubscription).toLocaleString(), // Mocking vault value same as max sub for now
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">
                    <BondHero
                        name={bondData.name}
                        status={bondData.status}
                        yieldRate={bondData.yieldRate}
                        maturityDays={bondData.maturityDays}
                    />

                    <BondStats
                        currentPrice={bondData.currentPrice}
                        totalSupply={bondData.totalSupply}
                        totalVault={bondData.totalVault}
                        yieldRate={bondData.yieldRate}
                        maturityDays={bondData.maturityDays}
                    />

                    <YieldChart />

                    <AssetVerification />

                    <BondDetailedInfo />
                </div>

                {/* Sidebar / Action Panel */}
                <div className="lg:col-span-4">
                    <div className="sticky top-24 space-y-6">
                        <Suspense fallback={<div className="h-[400px] w-full bg-[#100F14] animate-pulse rounded-xl" />}>
                            <ActionPanel bondStatus={bondData.status} />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    )
}
