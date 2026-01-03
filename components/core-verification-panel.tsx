import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink, Download, ShieldCheck } from "lucide-react"

export function CoreVerificationPanel() {
  return (
    <Card className="bg-[#100F14] border-primary/20 overflow-hidden">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2">
          {/* Summary Section */}
          <div className="p-8 space-y-6 border-b md:border-b-0 md:border-r border-primary/10">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-primary uppercase tracking-wider">Verification Summary</h3>
              <p className="text-2xl font-semibold">US Treasury 365D</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Asset Type</span>
                <span className="text-foreground font-medium">Government Bond</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Date Verified</span>
                <span className="text-foreground font-medium">Aug 12, 2025</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Verified By</span>
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  NanoTreasury Admin
                </div>
              </div>
            </div>

            <div className="pt-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">On-Chain Evidence</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono truncate mr-4">0x7a2...f3b9</span>
                  <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                    View Tx
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Proof Document Section */}
          <div className="p-8 bg-background/40 flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="text-sm font-medium text-primary uppercase tracking-wider">Proof Document</h3>

              <div className="relative group aspect-[4/3] rounded-xl bg-card border border-border/50 flex items-center justify-center overflow-hidden">
                <FileText className="w-16 h-16 text-muted-foreground/20 group-hover:text-primary/20 transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-4">
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 rounded bg-background border border-border/50">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">treasury_receipt_365d.pdf</p>
                      <p className="text-xs text-muted-foreground">2.4 MB • PDF Document</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                <Download className="w-4 h-4 mr-2" />
                Download Proof
              </Button>
              <Button
                variant="outline"
                className="border-primary/20 text-primary hover:bg-primary/5 font-semibold bg-transparent"
              >
                IPFS Link
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
