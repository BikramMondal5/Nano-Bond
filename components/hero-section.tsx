"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowRight, Eye, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import LiquidEther from "./liquid-ether";

export function HeroSection() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Liquid Ether Background - Full Screen */}
      <div className="absolute inset-0 z-0">
        <LiquidEther
          mouseForce={20}
          cursorSize={100}
          resolution={0.5}
          colors={["#f97316", "#fbbf24", "#fb923c"]}
          autoDemo={true}
          autoSpeed={0.3}
          autoIntensity={1.5}
          className="w-full h-full"
        />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 pt-20">
        {/* Hero Content */}
        <div className="text-center mb-16 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30 text-primary px-4 py-2 pointer-events-auto">
              <Sparkles className="w-4 h-4 mr-2" />
              Blockchain-Secured Government Bonds
            </Badge>
            <div className="relative">
              <div className="absolute inset-0 -inset-x-32 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
              <h1 className="relative text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
                <span className="text-white">
                  Fractional Bonds,
                </span>
                <br />
                <span className="text-primary">Unlimited Access</span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              Invest in government bonds with as little as $10. Tokenized, transparent, and accessible to everyone
              through blockchain technology.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 mb-20 pointer-events-auto"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black font-bold text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/50 hover:shadow-primary/70 transition-all duration-300"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Start Investing
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary font-bold text-lg px-8 py-6 rounded-xl backdrop-blur-sm transition-all duration-300"
            >
              <Eye className="w-5 h-5 mr-2" />
              View All Bonds
            </Button>
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
}
