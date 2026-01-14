
"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Download, ShieldCheck, Zap, Globe } from "lucide-react"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function MobileAppSection() {
    const content = useContentTranslation({
        tag: "Mobile Experience",
        title: "Take NanoBond With You",
        subtitle: "Experience the full power of NanoBond on your mobile device. Trade, track, and earn from anywhere in the world.",
        desc1: "The financial world moves fast. Opportunities don't wait for your desktop. What if there was an app, always connected, always secure, putting the power of fractional government bonds in your pocket?",
        desc2: "Our mission is to make bond investing as accessible and transparent as a text message, without compromising security. NanoBond Mobile is designed to be your always-on portfolio manager—monitoring yields, executing trades, and alerting you to opportunities 24/7.",
        cta: "Download Now",
        availability: "Available for Android. iOS coming soon."
    });

    return (
        <section className="pt-0 pb-4 md:pb-24 bg-background relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl opacity-30" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Top Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-400 mb-6">
                        <Globe className="w-3.5 h-3.5" />
                        {content.tag}
                    </div>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                        {content.title}
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {content.subtitle}
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                    {/* Left Side - Image */}
                    <div className="flex-1 w-full flex justify-center lg:justify-end relative group">
                        {/* Glow behind image */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-600/20 blur-2xl rounded-full scale-90 group-hover:scale-100 transition-transform duration-700 opacity-60" />

                        <div className="relative w-full max-w-[500px] aspect-square">
                            <Image
                                src="/mobile-app-showcase.png"
                                alt="NanoBond Mobile App Interface"
                                fill
                                className="object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                                priority
                            />
                        </div>
                    </div>

                    {/* Right Side - Content */}
                    <div className="flex-1 space-y-8 text-center lg:text-left">
                        <div className="space-y-4 hidden lg:block">
                            <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                                {content.desc1}
                            </p>

                            <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
                                {content.desc2}
                            </p>
                        </div>

                        <div className="pt-1">
                            <a href="https://drive.google.com/file/d/1yfi3mZafteGUC_O_d2UKyQVWJtJ_Xo-S/view?usp=drivesdk" target="_blank" rel="noopener noreferrer">
                                <Button className="h-14 px-8 text-lg font-bold bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 shadow-lg shadow-primary/25 rounded-xl w-full sm:w-auto">
                                    <Download className="mr-2 h-5 w-5" />
                                    {content.cta}
                                </Button>
                            </a>
                            <p className="mt-4 text-xs text-gray-500">{content.availability}</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
