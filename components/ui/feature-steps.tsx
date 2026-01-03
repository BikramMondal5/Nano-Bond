"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Feature {
    step: string
    title?: string
    content: string
    component?: React.ReactNode
}

interface FeatureStepsProps {
    features: Feature[]
    className?: string
    title?: string
    autoPlayInterval?: number
}

export function FeatureSteps({
    features,
    className,
    title = "How to get Started",
    autoPlayInterval = 3000,
}: FeatureStepsProps) {
    const [currentFeature, setCurrentFeature] = useState(0)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            if (progress < 100) {
                setProgress((prev) => prev + 100 / (autoPlayInterval / 100))
            } else {
                setCurrentFeature((prev) => (prev + 1) % features.length)
                setProgress(0)
            }
        }, 100)

        return () => clearInterval(timer)
    }, [progress, features.length, autoPlayInterval])

    return (
        <div className={cn("p-8 md:p-12", className)}>
            <div className="max-w-7xl mx-auto w-full">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-10 text-center bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                    {title}
                </h2>

                <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-10 items-start">
                    <div className="order-2 md:order-1 space-y-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                className="flex items-center gap-6 md:gap-8 cursor-pointer"
                                initial={{ opacity: 0.3 }}
                                animate={{ opacity: index === currentFeature ? 1 : 0.3 }}
                                transition={{ duration: 0.5 }}
                                onClick={() => {
                                    setCurrentFeature(index)
                                    setProgress(0)
                                }}
                            >
                                <motion.div
                                    className={cn(
                                        "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all",
                                        index === currentFeature
                                            ? "bg-primary border-primary text-primary-foreground scale-110"
                                            : "bg-muted border-muted-foreground",
                                    )}
                                >
                                    {index <= currentFeature ? (
                                        <span className="text-lg font-bold">✓</span>
                                    ) : (
                                        <span className="text-lg font-semibold">{index + 1}</span>
                                    )}
                                </motion.div>

                                <div className="flex-1">
                                    <h3 className="text-xl md:text-2xl font-semibold">
                                        {feature.title || feature.step}
                                    </h3>
                                    <p className="text-sm md:text-lg text-muted-foreground">
                                        {feature.content}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Static right component - positioned at the very top */}
                    <div className="order-1 md:order-2 w-full">
                        <div className="relative min-h-[400px] md:min-h-[500px] lg:min-h-[600px] overflow-hidden rounded-lg">
                            <div className="w-full h-full flex items-start justify-center">
                                {features[0]?.component}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
