import { ShoppingCart, FileUp, ShieldCheck, Lock } from "lucide-react"

export function VerificationGuide() {
  const steps = [
    {
      icon: ShoppingCart,
      title: "Asset Purchased",
      description: "Fund manager purchases the government bond off-chain.",
    },
    {
      icon: FileUp,
      title: "Receipt Uploaded",
      description: "Official bond receipt is uploaded to IPFS for immutability.",
    },
    {
      icon: ShieldCheck,
      title: "Admin Verified",
      description: "The asset is verified by authorized admins on-chain.",
    },
    {
      icon: Lock,
      title: "Deposits Enabled",
      description: "Smart contract opens for user deposits once verified.",
    },
  ]

  return (
    <section className="space-y-8">
      <div className="text-center md:text-left space-y-2">
        <h2 className="text-2xl font-bold text-foreground">How Verification Works</h2>
        <p className="text-muted-foreground">Our 4-step process ensures every token is fully backed.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, idx) => (
          <div key={idx} className="relative group">
            <div className="flex flex-col items-center md:items-start space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-2 text-center md:text-left">
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className="hidden lg:block absolute top-7 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-[1px] bg-gradient-to-r from-primary/30 to-transparent" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
