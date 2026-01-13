"use client"
import { useContentTranslation } from "@/hooks/useContentTranslation"
import { Wallet } from "lucide-react"

export function GovtBondsHeader() {
    const content = useContentTranslation({
        tag: "Safe & Secure Assets",
        title: "Government Bonds",
        description: "Explore our curated list of government-backed treasury bonds. Secure your future with guaranteed returns and low-risk investment options."
    })

    return (
        <div className="mb-12 space-y-4">
            <div className="inline-flex items-center rounded-full border border-[#FD8C00]/20 bg-[#FD8C00]/5 px-3 py-1 text-sm font-medium text-[#FD8C00]">
                {content.tag}
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
                {content.title}
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl">
                {content.description}
            </p>
        </div>
    )
}

export function MyBondsHeader() {
    const content = useContentTranslation({
        tag: "Your Holdings",
        title: "My Bonds",
        description: "View and manage your active government bond investments. Track your returns and maturity dates."
    })

    return (
        <div className="mb-12 space-y-4">
            <div className="inline-flex items-center rounded-full border border-[#FD8C00]/20 bg-[#FD8C00]/5 px-3 py-1 text-sm font-medium text-[#FD8C00]">
                <Wallet className="w-4 h-4 mr-2" />
                {content.tag}
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
                {content.title}
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl">
                {content.description}
            </p>
        </div>
    )
}
