// Enhanced with better visual hierarchy and gradient accents
export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Connect Wallet",
      description: "Link your digital wallet securely using WalletConnect or MetaMask. No KYC required for browsing.",
    },
    {
      number: "02",
      title: "Browse & Invest",
      description:
        "Explore curated government bonds with real-time yield data. Invest with stablecoins starting at $100.",
    },
    {
      number: "03",
      title: "Earn & Trade",
      description: "Receive automatic interest payments in USDT. Trade your bond tokens anytime on our DEX.",
    },
  ]

  return (
    <section id="how-it-works" className="py-24 px-4 relative overflow-hidden">
      {/* Background glow effects with orange palette */}
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-orange-500/10 blur-[120px] rounded-full -z-10 animate-glow-pulse" />
      <div
        className="absolute bottom-1/4 right-0 w-80 h-80 bg-orange-700/10 blur-[140px] rounded-full -z-10 animate-glow-pulse"
        style={{ animationDelay: "2s" }}
      />

      <div className="container mx-auto">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-400 mb-6">
            The Process
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
            How It Works
          </h2>
          <p className="text-xl text-orange-100/60 leading-relaxed">
            Start your investment journey in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative max-w-5xl mx-auto">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-16 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-orange-500/50 via-orange-700/50 to-orange-500/50" />

          {steps.map((step, idx) => (
            <div key={step.number} className="relative flex flex-col items-center text-center group">
              {/* Step number badge */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-black text-primary-foreground">{step.number}</span>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>

              {/* Decorative line for mobile */}
              {idx < steps.length - 1 && (
                <div className="md:hidden w-px h-8 bg-gradient-to-b from-orange-500/50 to-transparent mt-8" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
