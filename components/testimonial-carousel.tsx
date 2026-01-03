"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote, MessageSquareQuote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

// Default testimonial data
const defaultTestimonials = [
  {
    name: "Marcus Thorne",
    country: "Cloud Infrastructure Lead",
    type: "Enterprise",
    avatar: "https://i.pravatar.cc/150?u=marcus",
    feedback:
      "The agentic orchestration in NanoTreasury has transformed our treasury operations. We've seen a 40% reduction in settlement times due to autonomous audits.",
    rating: 5,
  },
  {
    name: "Dr. Sarah Chen",
    country: "USA",
    type: "Institutional",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    feedback:
      "Tokenized bonds cut our research phase by 60%. The on-chain transparency finds connections across yield curves we missed manually.",
    rating: 5,
  },
  {
    name: "James Wilson",
    country: "UK",
    type: "Asset Manager",
    avatar: "https://i.pravatar.cc/150?u=james",
    feedback:
      "The comprehensive audit reports generated are board-ready. It's like having a dedicated analyst team working 24/7 on portfolio optimization.",
    rating: 4,
  },
  {
    name: "Elena Rodriguez",
    country: "Spain",
    type: "FinTech",
    avatar: "https://i.pravatar.cc/150?u=elena",
    feedback:
      "Direct asset access from multiple chains is seamless. I can trust the yield quality because it links directly to the sovereign source.",
    rating: 5,
  },
  {
    name: "Akira Tanaka",
    country: "Japan",
    type: "Enterprise",
    avatar: "https://i.pravatar.cc/150?u=akira",
    feedback:
      "For evaluating fixed-income startups, this tool is indispensable. It quickly validates claims and highlights the competitive landscape.",
    rating: 4,
  },
  {
    name: "Dr. Emily Clarke",
    country: "Canada",
    type: "Wealth Advisor",
    avatar: "https://i.pravatar.cc/150?u=emily",
    feedback:
      "The ease of use is remarkable. Just entering a bond ticker gives me a holistic view from molecular properties to current market status.",
    rating: 5,
  },
]

const people = [
  {
    id: 1,
    name: "John Doe",
    designation: "Software Engineer",
    image:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3387&q=80",
  },
  {
    id: 2,
    name: "Robert Johnson",
    designation: "Product Manager",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
  },
  {
    id: 3,
    name: "Jane Smith",
    designation: "Data Scientist",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
  },
  {
    id: 4,
    name: "Emily Davis",
    designation: "UX Designer",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
  },
]

function AnimatedTooltip({ items }: { items: typeof people }) {
  return (
    <div className="flex flex-row items-center">
      {items.map((item, idx) => (
        <div key={item.id} className="relative group -ml-4 first:ml-0" style={{ zIndex: items.length - idx }}>
          <img
            src={item.image || "/placeholder.svg"}
            alt={item.name}
            className="w-10 h-10 rounded-full border-2 border-background object-cover transition-transform group-hover:scale-110"
          />
        </div>
      ))}
    </div>
  )
}

export default function TestimonialCarousel() {
  const router = useRouter()

  return (
    <section id="testimonials" className="relative py-24 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-400 mb-6">
          <MessageSquareQuote className="w-3.5 h-3.5" />
          Wall of Confidence
        </div>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
          Trusted by Industry Leaders
        </h2>
        <p className="text-lg text-orange-100/60 max-w-2xl mx-auto text-pretty">
          See how institutional teams are optimizing portfolios with NanoTreasury.
        </p>

        <div className="flex flex-col items-center gap-4 mt-8">
          <div className="flex flex-row items-center justify-center w-full">
            <AnimatedTooltip items={people} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-500">
            Empowering 1,200+ Financial Institutions
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden w-full py-4 mb-2">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee" style={{ width: "max-content" }}>
          {[...defaultTestimonials, ...defaultTestimonials].map((testimonial, index) => (
            <div key={index} className="px-4 flex-shrink-0" style={{ width: "450px" }}>
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <Button
            onClick={() => router.push("/login")}
            className="h-14 px-8 rounded-full bg-orange-500 text-white hover:bg-orange-600 font-bold text-base shadow-xl shadow-orange-500/20"
          >
            Share Your Experience
          </Button>
        </div>
      </div>

      <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
    </section>
  )
}

function TestimonialCard({ testimonial }: { testimonial: any }) {
  return (
    <Card
      className="relative group transition-all duration-500 h-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-orange-500/20 rounded-3xl overflow-hidden backdrop-blur-sm"
      style={{ minHeight: "280px" }}
    >
      <div className="absolute top-0 right-0 p-6 text-white/5 group-hover:text-orange-500/10 transition-colors">
        <Quote className="w-12 h-12 rotate-180" />
      </div>

      <CardContent className="p-8 flex flex-col h-full relative z-10">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <img
              src={testimonial.avatar || "/placeholder.svg"}
              alt={testimonial.name}
              className="w-14 h-14 rounded-2xl border border-white/10 object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-black" />
          </div>
          <div>
            <h4 className="font-bold text-white text-lg tracking-tight">{testimonial.name}</h4>
            <p className="text-xs font-medium uppercase tracking-widest text-orange-500/70">{testimonial.country}</p>
          </div>
        </div>

        <p className="text-white/60 text-base leading-relaxed text-pretty flex-grow mb-6 group-hover:text-white/90 transition-colors italic">
          "{testimonial.feedback}"
        </p>

        <div className="flex justify-between items-center mt-auto pt-6 border-t border-white/5">
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${star <= (testimonial.rating || 5) ? "fill-orange-500 text-orange-500" : "fill-none text-white/10"
                  }`}
              />
            ))}
          </div>
          <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-white/5 text-white/40 border border-white/10 group-hover:border-orange-500/30 group-hover:text-orange-500 transition-all">
            {testimonial.type}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
