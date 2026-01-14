"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle } from "lucide-react"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export function FaqSection() {
  const content = useContentTranslation({
    tag: "Knowledge Base",
    title: "Frequently Asked Questions",
    subtitle: "Everything you need to know about NanoBond",

    q1: "What is NanoBond, and how does it work?",
    a1: "NanoBond is a blockchain-based platform that tokenizes government bonds into fractional shares. Users can purchase bond fractions using stablecoins like USDT, earning fixed yields directly on-chain. Our smart contracts handle custody, interest distribution, and trading.",

    q2: "Are my investments secure?",
    a2: "Yes. All assets are held by regulated custodians, and our smart contracts have been audited by leading security firms. We use multi-signature wallets and implement industry-standard security protocols. Additionally, all bond tokens are backed 1:1 by real government bonds held in custody.",

    q3: "What is the minimum investment amount?",
    a3: "You can start investing with as little as $100 USDT. This makes institutional-grade government bonds accessible to retail investors who previously couldn't access these markets due to high minimum requirements.",

    q4: "How do I receive interest payments?",
    a4: "Interest payments are distributed automatically to your wallet in USDT based on the bond's coupon schedule. There's no need to claim or manually request payments—everything happens on-chain through our smart contracts.",

    q5: "Can I sell my bond tokens before maturity?",
    a5: "Absolutely. Unlike traditional bonds, you can trade your tokenized bond fractions on our secondary marketplace 24/7. This provides instant liquidity, allowing you to exit positions whenever needed without waiting for bond maturity."
  });

  const faqs = [
    { question: content.q1, answer: content.a1 },
    { question: content.q2, answer: content.a2 },
    { question: content.q3, answer: content.a3 },
    { question: content.q4, answer: content.a4 },
    { question: content.q5, answer: content.a5 },
  ]

  return (
    <section id="faq" className="py-24 px-4 relative">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-400 mb-6">
            <HelpCircle className="w-3.5 h-3.5" />
            {content.tag}
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
            {content.title}
          </h2>
          <p className="text-xl text-orange-100/60 leading-relaxed">{content.subtitle}</p>
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

