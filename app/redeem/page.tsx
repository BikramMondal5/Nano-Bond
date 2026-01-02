import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { RedemptionCard } from "@/components/redemption-card"
import { RedemptionSummary } from "@/components/redemption-summary"
import { RedemptionRules } from "@/components/redemption-rules"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function RedeemPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-foreground">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12 lg:pt-32">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Section */}
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
                  <BreadcrumbPage className="text-foreground">Redeem</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight italic font-serif">
                Redeem Your GBOND
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Exchange your GBOND tokens for USDT once the bond reaches maturity. Safe, instant, and transparent.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Core Action Zone */}
            <div className="lg:col-span-7">
              <RedemptionCard />
            </div>

            {/* Supplemental Info */}
            <div className="lg:col-span-5 space-y-8">
              <RedemptionSummary />
              <RedemptionRules />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
