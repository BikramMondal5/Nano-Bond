import { Badge } from "@/components/ui/badge"

export function RoadmapSection() {
  const roadmapItems = [
    {
      quarter: "Q2",
      year: "2025",
      items: [
        "Launch NanoBond platform on testnet",
        "Smart contract security audits",
        "Initial bond tokenization (US Treasury)",
        "Community beta testing program",
      ],
    },
    {
      quarter: "Q3",
      year: "2025",
      items: [
        "Mainnet deployment on Ethereum & Polygon",
        "Integration with major DeFi protocols",
        "Add bonds from 5+ countries",
        "Launch mobile app (iOS & Android)",
      ],
    },
    {
      quarter: "Q4",
      year: "2025",
      items: [
        "Cross-chain bridge implementation",
        "AI-powered portfolio optimization",
        "Institutional investor onboarding",
        "Secondary market liquidity pools",
      ],
    },
    {
      quarter: "Q1",
      year: "2026",
      items: [
        "Governance token launch",
        "DAO formation for platform decisions",
        "Expand to 20+ bond markets",
        "Automated yield farming strategies",
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
            Future Vision
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
            Timeline and Roadmap
          </h2>
          <p className="text-xl text-orange-100/60 max-w-2xl mx-auto leading-relaxed">
            Our vision for democratizing government bond investments
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
