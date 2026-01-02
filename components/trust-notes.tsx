import { CheckCircle2 } from "lucide-react"

export function TrustNotes() {
  const notes = [
    "IPFS guarantees document immutability and permanence",
    "Verification status is tied directly to on-chain data points",
    "No deposits are allowed into the vault until verification is complete",
    "Smart contracts hold all assets transparently for public auditing",
  ]

  return (
    <section className="p-8 rounded-2xl bg-[#100F14] border border-primary/10">
      <div className="grid md:grid-cols-3 gap-8 items-center">
        <div className="md:col-span-1 space-y-2">
          <h2 className="text-xl font-bold">Trust & Security</h2>
          <p className="text-sm text-muted-foreground">Why you can invest with absolute confidence.</p>
        </div>
        <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
          {notes.map((note, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground leading-tight">{note}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
