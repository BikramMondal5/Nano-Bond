"use client";

import { useContentTranslation } from "@/hooks/useContentTranslation"

// <CHANGE> Converted to infinite marquee animation inspired by Laika's partner strip
export function TrustStrip() {
  const content = useContentTranslation({
    tag: "Powered by Industry Leaders"
  });

  const partners = [
    "AWS",
    "Google Cloud",
    "Polygon",
    "Avalanche",
    "Chainlink",
    "Infura",
    "Optimism",
    "Arbitrum",
  ]

  return (
    <div className="py-8 border-y border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-4">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          {content.tag}
        </p>
      </div>

      {/* Infinite scrolling marquee */}
      <div className="relative flex overflow-x-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-4">
          {[...partners, ...partners].map((partner, idx) => (
            <div key={idx} className="mx-8 flex items-center">
              <div className="px-6 py-2 rounded-lg bg-muted/20 border border-border/20">
                <span className="text-lg font-bold text-foreground/60">{partner}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute top-0 flex animate-marquee whitespace-nowrap py-4" style={{ animationDelay: '0s' }}>
          {[...partners, ...partners].map((partner, idx) => (
            <div key={`duplicate-${idx}`} className="mx-8 flex items-center">
              <div className="px-6 py-2 rounded-lg bg-muted/20 border border-border/20">
                <span className="text-lg font-bold text-foreground/60">{partner}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
