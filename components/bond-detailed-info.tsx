import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function BondDetailedInfo() {
  return (
    <section className="space-y-6">
      <Tabs defaultValue="terms" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b border-white/5 rounded-none h-auto p-0 space-x-8">
          {["Bond Terms", "Underlying Asset", "Yield Calculation", "Legal Disclaimer"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab.toLowerCase().replace(" ", "-")}
              className="bg-transparent border-none rounded-none py-4 px-0 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-[#6B7280] hover:text-[#9CA3AF] transition-all"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="pt-6">
          <TabsContent value="bond-terms" className="space-y-4 text-[#9CA3AF] leading-relaxed">
            <p>
              This bond represents a fractional interest in a US Treasury Bill with a 365-day duration. The underlying
              asset is held in a bankruptcy-remote Special Purpose Vehicle (SPV) managed by GovtBond Custodial Services.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Maturity Date: April 15, 2026</li>
              <li>Face Value per GBOND: 1.25 USDT (Projected)</li>
              <li>Coupon Type: Zero-coupon (Accrual-based)</li>
              <li>Liquidity: Secondary market available via GovSwap</li>
            </ul>
          </TabsContent>

          <TabsContent value="underlying-asset" className="space-y-4 text-[#9CA3AF] leading-relaxed">
            <p>
              The underlying asset consists of US Treasury Bills (T-Bills) which are short-term debt obligations backed
              by the Treasury Department of the U.S. government with a maturity of one year or less.
            </p>
            <p>
              CUSIP: 912796YX5. The bills are held in a segregated account and are reconciled daily on-chain using
              Chainlink Proof of Reserve (PoR).
            </p>
          </TabsContent>

          <TabsContent value="yield-calculation" className="space-y-4 text-[#9CA3AF] leading-relaxed">
            <p>
              The 8.50% annualized yield is derived from the discount at which the T-Bills are purchased relative to
              their face value at maturity. This yield is smoothed out and applied to the GBOND token price daily.
            </p>
            <div className="p-4 bg-[#1C1A21] border border-white/5 rounded-lg font-mono text-xs text-primary/80">
              Yield = (Face Value / Current Price) ^ (365 / Days to Maturity) - 1
            </div>
          </TabsContent>

          <TabsContent value="legal-disclaimer" className="space-y-4 text-[#6B7280] text-sm italic leading-relaxed">
            <p>
              Investing in digital assets involves significant risk. The value of GBOND is tied to the underlying US
              Treasury Bills and the ability of the SPV to honor redemptions. This is not financial advice. Past
              performance does not guarantee future results. Access is restricted for residents of sanctioned
              jurisdictions.
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </section>
  )
}
