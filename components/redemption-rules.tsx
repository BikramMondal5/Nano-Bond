"use client"

import { CheckCircle2 } from "lucide-react"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function RedemptionRules() {
  const content = useContentTranslation({
    title: "Rules & Notes",
    rule1: "Bonds must be matured before redemption",
    rule2: "Transactions require blockchain confirmation",
    rule3: "Small gas fees apply for network execution",
    rule4: "Final amount based on live GBOND/USDT rate"
  })

  const rules = [
    content.rule1,
    content.rule2,
    content.rule3,
    content.rule4,
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">{content.title}</h3>
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
