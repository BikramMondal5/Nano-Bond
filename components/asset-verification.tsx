import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ExternalLink, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AssetVerification() {
  return (
    <Card className="bg-[#100F14] border-white/5 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <ShieldCheck className="w-32 h-32 text-primary" />
      </div>
      <CardHeader>
        <CardTitle className="text-[#E5E7EB] text-xl font-bold flex items-center gap-2">Asset Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#1C1A21] rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-[#E5E7EB] font-semibold text-sm">Underlying Asset PDF</h4>
                <p className="text-[#6B7280] text-xs">Official Treasury Receipt</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-white/10 hover:bg-white/5 text-[#E5E7EB] flex items-center gap-2 bg-transparent"
            >
              View on IPFS
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>

          <div className="p-4 bg-[#1C1A21] rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h4 className="text-[#E5E7EB] font-semibold text-sm">Audit Report</h4>
                <p className="text-[#6B7280] text-xs">Verified by ChainAuth</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-white/10 hover:bg-white/5 text-[#E5E7EB] flex items-center gap-2 bg-transparent"
            >
              View Audit
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex flex-wrap gap-x-8 gap-y-4">
          <div>
            <span className="text-[#6B7280] text-xs uppercase block mb-1">Verification Date</span>
            <span className="text-[#E5E7EB] text-sm font-medium">Oct 12, 2025</span>
          </div>
          <div>
            <span className="text-[#6B7280] text-xs uppercase block mb-1">Admin Signature</span>
            <span className="text-[#E5E7EB] text-sm font-mono truncate max-w-[150px]">0x71C...4f3E</span>
          </div>
          <div>
            <span className="text-[#6B7280] text-xs uppercase block mb-1">Custodian</span>
            <span className="text-[#E5E7EB] text-sm font-medium">Standard Chartered</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
