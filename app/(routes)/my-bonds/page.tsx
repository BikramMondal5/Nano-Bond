import { Suspense } from "react"
import { GovtBondsGrid } from "@/components/govt-bonds-grid"
import { Loader2, Wallet } from "lucide-react"
import connectDB from "@/lib/mongodb"
import Bond from "@/lib/models/Bond"

export const dynamic = "force-dynamic"

async function getBonds() {
    try {
        await connectDB()
        const bonds = await Bond.find({}).sort({ createdAt: -1 }).lean()
        return JSON.parse(JSON.stringify(bonds))
    } catch (error) {
        console.error("Failed to fetch bonds:", error)
        return []
    }
}

export default async function MyBondsPage() {
    // In a real application, we would filter these by the logged-in user's portfolio.
    // For now, to ensure consistent data and routing, we display all available bonds.
    const bonds = await getBonds()

    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 lg:px-8">
                {/* Header Section */}
                <div className="mb-12 space-y-4">
                    <div className="inline-flex items-center rounded-full border border-[#FD8C00]/20 bg-[#FD8C00]/5 px-3 py-1 text-sm font-medium text-[#FD8C00]">
                        <Wallet className="w-4 h-4 mr-2" />
                        Your Holdings
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
                        My Bonds
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl">
                        View and manage your active government bond investments. Track your returns and maturity dates.
                    </p>
                </div>

                {/* Bonds Grid */}
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center min-h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin text-[#FD8C00]" />
                        </div>
                    }
                >
                    <GovtBondsGrid bonds={bonds} basePath="/my-bonds" />
                </Suspense>
            </main>
        </div>
    )
}
