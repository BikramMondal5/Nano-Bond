import { Suspense } from "react"
import { Metadata } from "next"
import connectDB from "@/lib/mongodb"
import Bond from "@/lib/models/Bond"
import { GovtBondsGrid } from "@/components/govt-bonds-grid"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
    title: "Government Bonds | Nano-Bond",
    description: "Browse and invest in secure government bonds.",
}

// Force dynamic rendering to ensure we always get the latest bonds
export const dynamic = "force-dynamic"

async function getBonds() {
    try {
        await connectDB()
        // Simple serialization of the Mongoose documents
        const bonds = await Bond.find({}).sort({ createdAt: -1 }).lean()

        // Convert dates and _id to string/friendly format if needed
        // serialization for client component
        return JSON.parse(JSON.stringify(bonds))
    } catch (error) {
        console.error("Failed to fetch bonds:", error)
        return []
    }
}

export default async function GovtBondsPage() {
    const bonds = await getBonds()

    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 lg:px-8">
                {/* Header Section */}
                <div className="mb-12 space-y-4">
                    <div className="inline-flex items-center rounded-full border border-[#FD8C00]/20 bg-[#FD8C00]/5 px-3 py-1 text-sm font-medium text-[#FD8C00]">
                        Safe & Secure Assets
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
                        Government Bonds
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl">
                        Explore our curated list of government-backed treasury bonds. Secure your future with guaranteed returns and low-risk investment options.
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
                    <GovtBondsGrid bonds={bonds} />
                </Suspense>
            </main>
        </div>
    )
}
