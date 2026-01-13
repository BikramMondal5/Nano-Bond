"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function BondDetailedInfo() {
  const content = useContentTranslation({
    tab_terms: "Bond Terms",
    tab_asset: "Underlying Asset",
    tab_yield: "Yield Calculation",
    tab_legal: "Legal Disclaimer",
    // Terms Content
    term_p1: "This bond represents a fractional interest in a US Treasury Bill with a 365-day duration. The underlying asset is held in a bankruptcy-remote Special Purpose Vehicle (SPV) managed by NanoBond Custodial Services.",
    term_li1: "Maturity Date: April 15, 2026",
    term_li2: "Face Value per GBOND: 1.25 USDT (Projected)",
    term_li3: "Coupon Type: Zero-coupon (Accrual-based)",
    term_li4: "Liquidity: Secondary market available via GovSwap",
    // Asset Content
    asset_p1: "The underlying asset consists of US Treasury Bills (T-Bills) which are short-term debt obligations backed by the Treasury Department of the U.S. government with a maturity of one year or less.",
    asset_p2: "CUSIP: 912796YX5. The bills are held in a segregated account and are reconciled daily on-chain using Chainlink Proof of Reserve (PoR).",
    // Yield Content
    yield_p1: "The 8.50% annualized yield is derived from the discount at which the T-Bills are purchased relative to their face value at maturity. This yield is smoothed out and applied to the GBOND token price daily.",
    yield_code: "Yield = (Face Value / Current Price) ^ (365 / Days to Maturity) - 1",
    // Legal Content
    legal_p1: "Investing in digital assets involves significant risk. The value of GBOND is tied to the underlying US Treasury Bills and the ability of the SPV to honor redemptions. This is not financial advice. Past performance does not guarantee future results. Access is restricted for residents of sanctioned jurisdictions."
  })

  // Map tabs to values
  const tabs = [
    { label: content.tab_terms, value: "bond-terms" },
    { label: content.tab_asset, value: "underlying-asset" },
    { label: content.tab_yield, value: "yield-calculation" },
    { label: content.tab_legal, value: "legal-disclaimer" },
  ]

  return (
    <section className="space-y-6">
      <Tabs defaultValue="bond-terms" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-white/5 rounded-none h-auto p-0 space-x-8">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="bg-transparent border-none rounded-none py-4 px-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-[#6B7280] hover:text-[#9CA3AF] transition-all"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="pt-6">
          <TabsContent value="bond-terms" className="space-y-4 text-[#9CA3AF] leading-relaxed">
            <p>
              {content.term_p1}
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>{content.term_li1}</li>
              <li>{content.term_li2}</li>
              <li>{content.term_li3}</li>
              <li>{content.term_li4}</li>
            </ul>
          </TabsContent>

          <TabsContent value="underlying-asset" className="space-y-4 text-[#9CA3AF] leading-relaxed">
            <p>
              {content.asset_p1}
            </p>
            <p>
              {content.asset_p2}
            </p>
          </TabsContent>

          <TabsContent value="yield-calculation" className="space-y-4 text-[#9CA3AF] leading-relaxed">
            <p>
              {content.yield_p1}
            </p>
            <div className="p-4 bg-[#1C1A21] border border-white/5 rounded-lg font-mono text-xs text-primary/80">
              {content.yield_code}
            </div>
          </TabsContent>

          <TabsContent value="legal-disclaimer" className="space-y-4 text-[#6B7280] text-sm italic leading-relaxed">
            <p>
              {content.legal_p1}
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </section>
  )
}
