"use client";

import { useContentTranslation } from "@/hooks/useContentTranslation"

export function StatsSection() {
  const content = useContentTranslation({
    tvl_label: "Total Value Locked",
    investors_label: "Active Investors",
    markets_label: "Bond Markets",
    apy_label: "Average APY",

    tvl_value: "$2.5B+",
    investors_value: "50K+",
    markets_value: "12",
    apy_value: "5.2%"
  });

  const stats = [
    { label: content.tvl_label, value: content.tvl_value },
    { label: content.investors_label, value: content.investors_value },
    { label: content.markets_label, value: content.markets_value },
    { label: content.apy_label, value: content.apy_value },
  ]

  return (
    <section className="py-20 px-4 relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent -z-10" />

      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center space-y-2">
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-br from-orange to-gold bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
