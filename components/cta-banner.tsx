import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function CtaBanner() {
  return (
    <section className="py-24 px-4 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-orange-500/20 blur-[150px] rounded-full -z-10 animate-glow-pulse" />

      <div className="container mx-auto">
        <div className="relative rounded-3xl overflow-hidden border border-border/50 bg-gradient-to-br from-primary/20 via-card/50 to-secondary/20 backdrop-blur-xl p-12 md:p-20">
          {/* Decorative grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Floating orbs */}
          <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-secondary/30 blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-sm mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Join the Future of Investing</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6 leading-tight text-balance">
              Ready to earn stable returns from tokenized bonds?
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty leading-relaxed">
              Join thousands of investors already earning yields from government bonds. No minimums, no boundaries, no
              complexity.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-10 h-14 rounded-2xl text-lg font-bold group shadow-lg shadow-primary/25"
              >
                Launch App
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-border hover:bg-muted/50 px-10 h-14 rounded-2xl text-lg font-semibold bg-transparent backdrop-blur-sm"
              >
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
