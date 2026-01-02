"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Copy, Check, ExternalLink } from "lucide-react"
import { useState } from "react"

export function VerificationMetadata() {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const metadata = [
    { label: "IPFS CID", value: "QmXoyp...xyz123", id: "ipfs" },
    { label: "Uploaded On", value: "Aug 12, 2025 • 14:32 UTC", id: "date" },
    { label: "Source Receipt", value: "View Official PDF", id: "receipt", isLink: true },
    { label: "Smart Contract Proof", value: "0x4f...92e1", id: "proof" },
    { label: "Verifier Address", value: "0xAdmin...8821", id: "verifier" },
  ]

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Verification Metadata</h2>
      <Card className="bg-[#100F14] border-border/50">
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {metadata.map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{item.label}</span>
                <div className="flex items-center gap-3">
                  <code className="text-sm md:text-base font-mono bg-background px-3 py-1.5 rounded border border-border/50 text-foreground">
                    {item.value}
                  </code>
                  {item.isLink ? (
                    <button className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCopy(item.value, item.id)}
                      className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                    >
                      {copied === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
