import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ShieldCheck, Clock, FileText } from "lucide-react"

export function InvestmentRules() {
  const rules = [
    {
      title: "Investment Thresholds",
      desc: "Minimum 100 USDT, maximum 50,000 USDT per single transaction.",
      icon: CheckCircle2,
    },
    {
      title: "Identity Verification",
      desc: "Standard KYC required for cumulative investments above $5,000.",
      icon: ShieldCheck,
    },
    {
      title: "Liquidity & Maturity",
      desc: "Bonds mature in 187 days. Secondary market available for early exit.",
      icon: Clock,
    },
    {
      title: "Fees Transparency",
      desc: "0.5 USDT flat fee per minting operation. No hidden management fees.",
      icon: FileText,
    },
  ]

  return (
    <Card className="bg-[#100F14] border-white/5 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">Investment Guidelines</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {rules.map((rule, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="mt-1">
              <rule.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-1">
              <h5 className="text-sm font-semibold text-white">{rule.title}</h5>
              <p className="text-xs text-muted-foreground leading-relaxed">{rule.desc}</p>
            </div>
          </div>
        ))}

        <div className="pt-2">
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-[11px] text-muted-foreground italic leading-normal">
              "Buying GBOND tokens represents a fractional interest in tokenized US Treasury Bills held in regulated
              escrow."
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
