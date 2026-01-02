"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export function PricingSection() {
  const pricingPlans = [
    {
      name: "Starter",
      price: "₹0",
      frequency: "/month",
      description: "Perfect for individual investors getting started with tokenized bonds.",
      features: [
        "Invest in fractional bonds",
        "Basic portfolio tracking",
        "Yield history visualization",
        "7-day analytics retention",
        "Community support",
      ],
      buttonText: "Get Started Free",
      highlighted: false,
    },
    {
      name: "Professional",
      price: "₹4,999",
      frequency: "/month",
      description: "For institutional traders requiring advanced on-chain yield analytics.",
      features: [
        "Higher investment limits",
        "Advanced AI-driven yield predictions",
        "Real-time market simulations",
        "Unlimited data retention",
        "Priority settlement & SOC assistance",
        "Custom tax reporting mapping",
      ],
      buttonText: "Upgrade to Pro",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      frequency: "",
      description: "Tailored for large organizations requiring full-scale liquidity pools.",
      features: [
        "Unlimited asset allocation",
        "Autonomous treasury response",
        "Multi-tenant bond architecture",
        "Custom integrations & SSO",
        "24/7 dedicated support team",
        "White-label bond issuance",
      ],
      buttonText: "Contact Us",
      highlighted: false,
    },
  ]

  return (
    <section className="relative py-24 overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-orange-950/10 to-black" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-400 mb-6">
            Investment Tiers
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
            Institutional Grade Pricing
          </h2>
          <p className="text-lg text-orange-100/60 max-w-2xl mx-auto">
            Choose the plan that fits your investment strategy — from individual exploration to full-scale institutional
            orchestration.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative group rounded-3xl p-8 flex flex-col backdrop-blur-sm transition-all duration-300 ${
                plan.highlighted
                  ? "bg-gradient-to-br from-orange-950/40 to-orange-900/30 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20 md:scale-105"
                  : "bg-white/[0.02] border border-white/10 hover:border-orange-500/30 hover:bg-white/[0.05]"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white text-xs font-bold uppercase tracking-widest">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-4">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-300">
                    {plan.price}
                  </span>
                  {plan.frequency && <span className="text-lg text-orange-200/60">{plan.frequency}</span>}
                </div>
                <p className="text-orange-200/60 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-sm">
                    <Check
                      className={`h-5 w-5 mr-3 flex-shrink-0 mt-0.5 ${
                        plan.highlighted ? "text-orange-400" : "text-orange-500/70"
                      }`}
                    />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full rounded-full font-bold transition-all ${
                  plan.highlighted
                    ? "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:scale-105"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                {plan.buttonText}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
