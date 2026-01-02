import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export function FeeBreakdown() {
  return (
    <Card className="bg-[#100F14] border-white/5">
      <CardHeader>
        <CardTitle className="text-[#E5E7EB] text-lg font-bold">Fee Logic Explained</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              <span className="text-white font-medium">10% Protocol Fee</span> goes directly to the SponsorVault as
              rewards for liquidity providers.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              <span className="text-white font-medium">90% Yield</span> is distributed among bond holders at the time of
              maturity.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Rewards are calculated based on your <span className="text-white font-medium">pro-rata share</span> of the
              total sponsored value.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
