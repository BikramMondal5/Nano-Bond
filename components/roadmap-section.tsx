"use client";

import { Badge } from "@/components/ui/badge"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function RoadmapSection() {
  const content = useContentTranslation({
    tag: "Future Vision",
    title: "Timeline and Roadmap",
    subtitle: "Our vision for democratizing government bond investments",

    // Q2 2025
    q2_item1: "Launch NanoBond platform on testnet",
    q2_item2: "Smart contract security audits",
    q2_item3: "Initial bond tokenization (US Treasury)",
    q2_item4: "Community beta testing program",

    // Q3 2025
    q3_item1: "Mainnet deployment on Ethereum & Polygon",
    q3_item2: "Integration with major DeFi protocols",
    q3_item3: "Add bonds from 5+ countries",
    q3_item4: "Launch mobile app (iOS & Android)",

    // Q4 2025
    q4_item1: "Cross-chain bridge implementation",
    q4_item2: "AI-powered portfolio optimization",
    q4_item3: "Institutional investor onboarding",
    q4_item4: "Secondary market liquidity pools",

    // Q1 2026
    q1_26_item1: "Governance token launch",
    q1_26_item2: "DAO formation for platform decisions",
    q1_26_item3: "Expand to 20+ bond markets",
    q1_26_item4: "Automated yield farming strategies",
  });

  const roadmapItems = [
    {
      quarter: "Q2",
      year: "2025",
      items: [
        content.q2_item1,
        content.q2_item2,
        content.q2_item3,
        content.q2_item4,
      ],
    },
    {
      quarter: "Q3",
      year: "2025",
      items: [
        content.q3_item1,
        content.q3_item2,
        content.q3_item3,
        content.q3_item4,
      ],
    },
    {
      quarter: "Q4",
      year: "2025",
      items: [
        content.q4_item1,
        content.q4_item2,
        content.q4_item3,
        content.q4_item4,
      ],
    },
    {
      quarter: "Q1",
      year: "2026",
      items: [
        content.q1_26_item1,
        content.q1_26_item2,
        content.q1_26_item3,
        content.q1_26_item4,
      ],
    },
  ]

  return (
    <section id="roadmap" className="py-24 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/10 blur-[150px] rounded-full -z-10" />

      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-400 mb-6">
            {content.tag}
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
            {content.title}
          </h2>
          <p className="text-xl text-orange-100/60 max-w-2xl mx-auto leading-relaxed">
            {content.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roadmapItems.map((item, idx) => (
            <div
              key={idx}
              className="relative p-6 rounded-2xl bg-card/30 border border-border/50 backdrop-blur-sm hover:border-primary/50 transition-all group"
            >
              {/* Quarter badge */}
              <div className="flex items-center gap-2 mb-6">
                <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-sm font-bold">
                  {item.quarter}
                </Badge>
                <span className="text-2xl font-black text-foreground/80">{item.year}</span>
              </div>

              {/* Items list */}
              <ul className="space-y-3">
                {item.items.map((task, taskIdx) => (
                  <li key={taskIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span className="leading-relaxed">{task}</span>
                  </li>
                ))}
              </ul>

              {/* Decorative gradient on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
