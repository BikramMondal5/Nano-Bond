"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ShieldCheck, Clock, FileText } from "lucide-react"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function InvestmentRules() {
  const content = useContentTranslation({
    title: "Investment Guidelines",
    rule1_title: "Investment Thresholds",
    rule1_desc: "Minimum 100 USDT, maximum 50,000 USDT per single transaction.",
    rule2_title: "Identity Verification",
    rule2_desc: "Standard KYC required for cumulative investments above $5,000.",
    rule3_title: "Liquidity & Maturity",
    rule3_desc: "Bonds mature in 187 days. Secondary market available for early exit.",
    rule4_title: "Fees Transparency",
    rule4_desc: "0.5 USDT flat fee per minting operation. No hidden management fees.",
    disclaimer: "\"Buying GBOND tokens represents a fractional interest in tokenized US Treasury Bills held in regulated escrow.\""
  })

  const rules = [
    {
      title: content.rule1_title,
      desc: content.rule1_desc,
      icon: CheckCircle2,
    },
    {
      title: content.rule2_title,
      desc: content.rule2_desc,
      icon: ShieldCheck,
    },
    {
      title: content.rule3_title,
      desc: content.rule3_desc,
      icon: Clock,
    },
    {
      title: content.rule4_title,
      desc: content.rule4_desc,
      icon: FileText,
    },
  ]

  return (
    <Card className="bg-[#100F14] border-white/5 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">{content.title}</CardTitle>
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
              {content.disclaimer}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
