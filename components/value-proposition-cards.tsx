import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Wallet, Shield, Globe, TrendingUp, Lock, Zap } from "lucide-react"

// Updated to bento grid layout with larger feature cards
export function ValuePropositionCards() {
  const features = [
    {
      title: "AI Bond Analytics",
      description:
        "Leverage advanced AI to analyze bond performance, risk profiles, and yield predictions in real-time.",
      icon: TrendingUp,
      size: "large",
    },
    {
      title: "Fractional Ownership",
      description: "Own government bonds starting from $100.",
      icon: Wallet,
      size: "small",
    },
    {
      title: "Military-Grade Security",
      description: "Multi-sig wallets and audited smart contracts protect your assets.",
      icon: Shield,
      size: "small",
    },
    {
      title: "Global Marketplace",
      description:
        "Access bonds from 50+ countries with instant settlement and 24/7 trading on our decentralized exchange.",
      icon: Globe,
      size: "large",
    },
    {
      title: "Instant Liquidity",
      description: "Trade bond fractions anytime, anywhere.",
      icon: Zap,
      size: "small",
    },
    {
      title: "Regulatory Compliant",
      description: "Fully licensed and regulated across major jurisdictions.",
      icon: Lock,
      size: "small",
    },
  ]

  return (
    <section id="features" className="py-24 px-4 relative">
      {/* Background glow effect */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-secondary/20 blur-[150px] rounded-full -z-10" />

      <div className="container mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-400 mb-6">
            Core Features
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
            Powerful Features for Modern Investors
          </h2>
          <p className="text-xl text-orange-100/60 leading-relaxed">
            Everything you need to invest in government bonds with the power of blockchain technology.
          </p>
        </div>

        {/* Bento grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {features.map((feature, idx) => (
            <Card
              key={idx}
              className={`bg-card/50 border-border/50 hover:border-primary/50 transition-all duration-300 group backdrop-blur-sm ${
                feature.size === "large" ? "md:col-span-2" : ""
              }`}
            >
              <CardHeader className={feature.size === "large" ? "p-8" : "p-6"}>
                <div
                  className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all ${
                    feature.size === "large" ? "w-14 h-14" : ""
                  }`}
                >
                  <feature.icon className={`text-primary ${feature.size === "large" ? "w-7 h-7" : "w-6 h-6"}`} />
                </div>
                <CardTitle className={`text-foreground mb-3 ${feature.size === "large" ? "text-2xl" : "text-xl"}`}>
                  {feature.title}
                </CardTitle>
                <CardDescription
                  className={`text-muted-foreground leading-relaxed ${
                    feature.size === "large" ? "text-base" : "text-sm"
                  }`}
                >
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
