"use client"

import { FeatureSteps } from "@/components/ui/feature-steps"
import { CpuArchitecture } from "@/components/ui/cpu-architecture"
import { Shield, TrendingUp, Zap } from "lucide-react"

export function PlatformFeaturesSection() {
    const features = [
        {
            step: "Step 1",
            title: "Blockchain Security",
            content: "All bonds are tokenized on-chain with military-grade security and transparent smart contracts.",
            component: (
                <div className="w-full h-full flex items-center justify-center p-8">
                    <CpuArchitecture
                        imageUrl="/crypto-logo.png"
                        className="w-full h-full"
                    />
                </div>
            ),
        },
    ]

    return (
        <section className="py-24 px-4 relative bg-transparent">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent -z-10" />

            <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-400 mb-6">
                        <Zap className="w-3.5 h-3.5" />
                        Platform Features
                    </div>
                </div>

                <FeatureSteps
                    features={features}
                    title="Why Choose NanoBond"
                    autoPlayInterval={4000}
                    className="p-0"
                />
            </div>
        </section>
    )
}
