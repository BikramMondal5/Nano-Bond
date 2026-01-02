// <CHANGE> Converted to infinite marquee animation inspired by Laika's partner strip
export function TrustStrip() {
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
      <div className="container mx-auto px-4 mb-4">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          Powered by Industry Leaders
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
