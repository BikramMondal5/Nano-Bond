"use client"

import { Navbar } from "@/components/navbar"
import { MatrixRain } from "@/components/cyber-hero"
import { Rocket } from "lucide-react"
import { useContentTranslation } from "@/hooks/useContentTranslation"
import { Suspense } from "react"
import SignUpFormContent from "@/components/sign-up/sign-up-form-content"

export default function SignUpPageContent() {
    const content = useContentTranslation({
        hero_title: "Build Your Bond Portfolio",
        hero_desc: "Join thousands of investors accessing government bonds through blockchain technology. Earn stable returns with complete transparency and security.",
        feat_1: "Start with as little as $10",
        feat_2: "Bank-grade security & transparency",
        feat_3: "24/7 portfolio access & management"
    });

    return (
        <div className="min-h-screen bg-black flex flex-col relative">
            <Navbar />
            <MatrixRain opacity={0.25} speed={0.5} />
            <div className="flex-1 flex relative z-10 overflow-hidden">
                {/* Left Side - Image Container */}
                <div className="hidden lg:flex lg:w-1/2 fixed left-0 top-0 h-screen items-center justify-center p-12 overflow-hidden">
                    <div className="absolute inset-0">
                        <img
                            src="/sign-up-banner.jpeg"
                            alt="Bond Portfolio Investment"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/80 via-orange-900/70 to-black/60" />
                    </div>
                    <div className="relative z-10 max-w-lg">
                        <div className="mb-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-orange-500/20 border-2 border-orange-500/30 mb-6">
                                <Rocket className="w-12 h-12 text-orange-400" />
                            </div>
                            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-orange-300 to-amber-400">
                                {content.hero_title}
                            </h1>
                            <p className="text-lg text-orange-200/60 leading-relaxed">
                                {content.hero_desc}
                            </p>
                        </div>
                        <div className="space-y-4 text-sm text-orange-200/50">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-white">{content.feat_1}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-white">{content.feat_2}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-white">{content.feat_3}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form Container */}
                <div className="w-full lg:w-1/2 lg:ml-[50%] flex items-start justify-center p-6 py-24 overflow-y-auto scrollbar-hide min-h-screen">
                    <Suspense
                        fallback={<div className="text-orange-400 animate-pulse font-mono">INITIALIZING AGENT UPLINK...</div>}
                    >
                        <SignUpFormContent />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
