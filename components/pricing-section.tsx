"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function PricingSection() {
  const content = useContentTranslation({
    tag: "Investment Tiers",
    title: "Institutional Grade Pricing",
    subtitle: "Choose the plan that fits your investment strategy — from individual exploration to full-scale institutional orchestration.",

    starter_name: "Starter",
    starter_desc: "Perfect for individual investors getting started with tokenized bonds.",
    starter_f1: "Invest in fractional bonds",
    starter_f2: "Basic portfolio tracking",
    starter_f3: "Yield history visualization",
    starter_f4: "7-day analytics retention",
    starter_f5: "Community support",
    starter_btn: "Get Started Free",

    pro_name: "Professional",
    pro_desc: "For institutional traders requiring advanced on-chain yield analytics.",
    pro_f1: "Higher investment limits",
    pro_f2: "Advanced AI-driven yield predictions",
    pro_f3: "Real-time market simulations",
    pro_f4: "Unlimited data retention",
    pro_f5: "Priority settlement & SOC assistance",
    pro_f6: "Custom tax reporting mapping",
    pro_btn: "Upgrade to Pro",
    popular_tag: "Most Popular",

    enterprise_name: "Enterprise",
    enterprise_desc: "Tailored for large organizations requiring full-scale liquidity pools.",
    enterprise_price: "Custom",
    enterprise_f1: "Unlimited asset allocation",
    enterprise_f2: "Autonomous treasury response",
    enterprise_f3: "Multi-tenant bond architecture",
    enterprise_f4: "Custom integrations & SSO",
    enterprise_f5: "24/7 dedicated support team",
    enterprise_f6: "White-label bond issuance",
    enterprise_btn: "Contact Us"
  });

  const pricingPlans = [
    {
      name: content.starter_name,
      price: "₹0",
      frequency: "/month",
      description: content.starter_desc,
      features: [
        content.starter_f1,
        content.starter_f2,
        content.starter_f3,
        content.starter_f4,
        content.starter_f5,
      ],
      buttonText: content.starter_btn,
      highlighted: false,
    },
    {
      name: content.pro_name,
      price: "₹4,999",
      frequency: "/month",
      description: content.pro_desc,
      features: [
        content.pro_f1,
        content.pro_f2,
        content.pro_f3,
        content.pro_f4,
        content.pro_f5,
        content.pro_f6,
      ],
      buttonText: content.pro_btn,
      highlighted: true,
    },
    {
      name: content.enterprise_name,
      price: content.enterprise_price,
      frequency: "",
      description: content.enterprise_desc,
      features: [
        content.enterprise_f1,
        content.enterprise_f2,
        content.enterprise_f3,
        content.enterprise_f4,
        content.enterprise_f5,
        content.enterprise_f6,
      ],
      buttonText: content.enterprise_btn,
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
            {content.tag}
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
            {content.title}
          </h2>
          <p className="text-lg text-orange-100/60 max-w-2xl mx-auto">
            {content.subtitle}
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
              className={`relative group rounded-3xl p-8 flex flex-col backdrop-blur-sm transition-all duration-300 ${plan.highlighted
                  ? "bg-gradient-to-br from-orange-950/40 to-orange-900/30 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20 md:scale-105"
                  : "bg-white/[0.02] border border-white/10 hover:border-orange-500/30 hover:bg-white/[0.05]"
                }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white text-xs font-bold uppercase tracking-widest">
                  {content.popular_tag}
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
                      className={`h-5 w-5 mr-3 flex-shrink-0 mt-0.5 ${plan.highlighted ? "text-orange-400" : "text-orange-500/70"
                        }`}
                    />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full rounded-full font-bold transition-all ${plan.highlighted
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
