export function StatsSection() {
  const stats = [
    { label: "Total Value Locked", value: "$2.5B+" },
    { label: "Active Investors", value: "50K+" },
    { label: "Bond Markets", value: "12" },
    { label: "Average APY", value: "5.2%" },
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
