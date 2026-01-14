import { Suspense } from "react"
import { Metadata } from "next"
import connectDB from "@/lib/mongodb"
import Bond from "@/lib/models/Bond"
import { GovtBondsGrid } from "@/components/govt-bonds-grid"
import { Loader2 } from "lucide-react"
import { GovtBondsHeader } from "@/components/generated-headers"

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
                <GovtBondsHeader />

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
