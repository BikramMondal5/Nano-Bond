"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"

export function FaqSection() {
  const faqs = [
    {
      question: "What is NanoBond, and how does it work?",
      answer:
        "NanoBond is a blockchain-based platform that tokenizes government bonds into fractional shares. Users can purchase bond fractions using stablecoins like USDT, earning fixed yields directly on-chain. Our smart contracts handle custody, interest distribution, and trading.",
    },
    {
      question: "Are my investments secure?",
      answer:
        "Yes. All assets are held by regulated custodians, and our smart contracts have been audited by leading security firms. We use multi-signature wallets and implement industry-standard security protocols. Additionally, all bond tokens are backed 1:1 by real government bonds held in custody.",
    },
    {
      question: "What is the minimum investment amount?",
      answer:
        "You can start investing with as little as $100 USDT. This makes institutional-grade government bonds accessible to retail investors who previously couldn't access these markets due to high minimum requirements.",
    },
    {
      question: "How do I receive interest payments?",
      answer:
        "Interest payments are distributed automatically to your wallet in USDT based on the bond's coupon schedule. There's no need to claim or manually request payments—everything happens on-chain through our smart contracts.",
    },
    {
      question: "Can I sell my bond tokens before maturity?",
      answer:
        "Absolutely. Unlike traditional bonds, you can trade your tokenized bond fractions on our secondary marketplace 24/7. This provides instant liquidity, allowing you to exit positions whenever needed without waiting for bond maturity.",
    },
  ]

  return (
    <section id="faq" className="py-24 px-4 relative">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-400 mb-6">
            <HelpCircle className="w-3.5 h-3.5" />
            Knowledge Base
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-orange-100/60 leading-relaxed">Everything you need to know about NanoBond</p>
        </div>

        {/* FAQ Section - Full Width */}
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border border-border/50 rounded-xl px-6 bg-card/30 backdrop-blur-sm hover:border-primary/50 transition-colors"
              >
                <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

