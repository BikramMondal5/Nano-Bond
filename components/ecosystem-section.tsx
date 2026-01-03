"use client"

import { CpuArchitecture } from "@/components/ui/cpu-architecture"
import { Shield, TrendingUp, Zap, Lock, Coins, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export function EcosystemSection() {
    const features = [
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Military-Grade Security",
            description: "Multi-signature wallets and audited smart contracts protecting your investments",
        },
        {
            icon: <TrendingUp className="w-6 h-6" />,
            title: "Real-Time Analytics",
            description: "AI-powered bond analytics with performance tracking and yield predictions",
        },
        {
            icon: <Lock className="w-6 h-6" />,
            title: "Decentralized Infrastructure",
            description: "Built on cutting-edge blockchain for maximum transparency and reliability",
        },
        {
            icon: <Coins className="w-6 h-6" />,
            title: "Fractional Ownership",
            description: "Invest in government bonds with as little as $10, no barriers to entry",
        },
        {
            icon: <BarChart3 className="w-6 h-6" />,
            title: "Automated Yield Distribution",
            description: "Receive interest payments automatically in USDT based on bond schedules",
        },
    ]

    const integrations = [
        { name: "Ethereum", position: "top-left", icon: "⟠" },
        { name: "USDT", position: "bottom-right", icon: "₮" },
    ]

    return (
        <section className="py-24 px-4 relative bg-transparent overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent -z-10" />

            <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-400 mb-6">
                        <Zap className="w-3.5 h-3.5" />
                        Platform Ecosystem
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                        Why Choose NanoTreasury
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Built on a robust blockchain infrastructure connecting the best in DeFi
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Left Side - Feature Cards */}
                    <div className="space-y-4">
                        {features.map((feature, index) => (
                            <Card
                                key={index}
                                className="border border-border/50 bg-card/30 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            {feature.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                                {feature.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Right Side - Blockchain Circuit with Connected Logos */}
                    <div className="relative min-h-[600px] flex items-center justify-center p-8">
                        {/* SVG for Dotted Lines */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 5 }}>
                            <defs>
                                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
                                    <stop offset="100%" stopColor="#4ade80" stopOpacity="0.8" />
                                </linearGradient>
                            </defs>

                            {/* Top-Left Icon to Circuit Top (Rounded Corner) */}
                            <path
                                d="M 15 15 L 35 15 Q 50 15 50 30 L 50 35"
                                stroke="url(#line-gradient)"
                                strokeWidth="2"
                                strokeDasharray="4 6"
                                fill="none"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                                className="stroke-[4px]"
                            />

                            {/* Circuit Bottom to Bottom-Right Icon (Rounded Corner) */}
                            <path
                                d="M 50 65 L 50 70 Q 50 85 65 85 L 85 85"
                                stroke="url(#line-gradient)"
                                strokeWidth="2"
                                strokeDasharray="4 6"
                                fill="none"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                                className="stroke-[4px]"
                            />
                        </svg>

                        {/* Central Blockchain Circuit */}
                        <div className="relative w-full h-full flex items-center justify-center">
                            <div className="w-full h-full max-w-[500px] max-h-[500px] relative z-10">
                                <CpuArchitecture
                                    imageUrl="/logo.png"
                                    className="w-full h-full"
                                />
                            </div>

                            {/* Top-Left Icon */}
                            <div className="absolute top-[-50%] left-[0%] z-20">
                                <div className="relative group">
                                    <div className="relative w-28 h-28 rounded-full bg-black/80 backdrop-blur-md flex flex-col items-center justify-center hover:scale-105 transition-transform duration-300 shadow-[inset_0_0_20px_2px_rgba(34,197,94,0.6)] border border-green-500/20">
                                        <div className="relative w-16 h-16">
                                            <Image
                                                src="/crypto-logo.png"
                                                alt="Platform Logo"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>

                                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-sm font-semibold text-green-400 bg-black/90 px-3 py-1.5 rounded border border-green-500/30 shadow-lg">
                                            {integrations[0].name}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom-Right Icon */}
                            <div className="absolute bottom-[-50%] right-[0%] z-20">
                                <div className="relative group">
                                    <div className="relative w-28 h-28 rounded-full bg-black/80 backdrop-blur-md flex flex-col items-center justify-center hover:scale-105 transition-transform duration-300 shadow-[inset_0_0_20px_2px_rgba(34,197,94,0.6)] border border-green-500/20">
                                        <div className="relative w-16 h-16">
                                            <Image
                                                src="/USDT-logo.png"
                                                alt="USDT Logo"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>

                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-sm font-semibold text-green-400 bg-black/90 px-3 py-1.5 rounded border border-green-500/30 shadow-lg">
                                            {integrations[1].name}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Animated Glow Effect */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-[550px] h-[550px] rounded-full bg-primary/5 blur-3xl animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
