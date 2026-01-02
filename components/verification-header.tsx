import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"

export function VerificationHeader() {
  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center mb-6">
        <Badge
          variant="outline"
          className="px-4 py-1.5 border-primary/30 bg-primary/5 text-primary gap-2 text-sm font-medium"
        >
          <CheckCircle2 className="w-4 h-4" />
          Verified Asset
        </Badge>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Asset Verification</h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Proof that this bond is backed by real-world government assets and verified on-chain. Transparency is our core
        principle.
      </p>
    </div>
  )
}
