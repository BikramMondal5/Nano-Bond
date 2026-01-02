import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { InvestmentCard } from "@/components/investment-card"
import { MetricsPanel } from "@/components/metrics-panel"
import { InvestmentRules } from "@/components/investment-rules"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function InvestPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-foreground">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12 lg:pt-32">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Breadcrumbs & Header */}
          <div className="space-y-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-muted-foreground hover:text-primary">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-foreground">Invest</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Invest in GBOND Tokens</h1>
              <p className="text-lg text-muted-foreground">
                Buy fractional Government Bonds using USDT with instant settlement.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Core Action Zone */}
            <div className="lg:col-span-7">
              <InvestmentCard />
            </div>

            {/* Supplemental Info */}
            <div className="lg:col-span-5 space-y-8">
              <MetricsPanel />
              <InvestmentRules />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
