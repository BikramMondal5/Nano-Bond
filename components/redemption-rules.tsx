import { CheckCircle2 } from "lucide-react"

export function RedemptionRules() {
  const rules = [
    "Bonds must be matured before redemption",
    "Transactions require blockchain confirmation",
    "Small gas fees apply for network execution",
    "Final amount based on live GBOND/USDT rate",
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Rules & Notes</h3>
      <div className="grid gap-3">
        {rules.map((rule, idx) => (
          <div key={idx} className="flex gap-3 group">
            <div className="mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-muted-foreground group-hover:text-white transition-colors">{rule}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
