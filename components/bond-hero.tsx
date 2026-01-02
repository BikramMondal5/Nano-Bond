import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock } from "lucide-react"

interface BondHeroProps {
  name: string
  status: string
  yieldRate: string
  maturityDays: number
}

export function BondHero({ name, status, yieldRate, maturityDays }: BondHeroProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {status === "verified" ? (
          <Badge className="bg-primary/20 text-primary border-primary/30 py-1 px-3 flex gap-1.5 items-center">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-muted/50 text-muted-foreground py-1 px-3 flex gap-1.5 items-center">
            <Clock className="w-3.5 h-3.5" />
            Pending Verification
          </Badge>
        )}
        <span className="text-muted-foreground text-sm">•</span>
        <span className="text-primary font-medium text-sm">{yieldRate} Annualized Yield</span>
        <span className="text-muted-foreground text-sm">•</span>
        <span className="text-muted-foreground text-sm">Matures in {maturityDays} days</span>
      </div>

      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#E5E7EB]">{name}</h1>

      <p className="text-[#9CA3AF] text-lg max-w-2xl leading-relaxed">
        Secure fractional ownership of US government-backed treasury bills, tokenized for instant liquidity and 24/7
        trading on-chain.
      </p>
    </section>
  )
}
