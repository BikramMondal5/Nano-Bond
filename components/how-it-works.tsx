"use client";

import { cn } from "@/lib/utils";
import { Wallet, TrendingUp, Coins } from "lucide-react";
import type React from "react";

// The main props for the HowItWorks component
interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> { }

// The props for a single step card
interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
}

/**
 * A single step card within the "How It Works" section.
 * It displays an icon, title, description, and a list of benefits.
 */
const StepCard: React.FC<StepCardProps> = ({
  icon,
  title,
  description,
  benefits,
}) => (
  <div
    className={cn(
      "relative rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 text-card-foreground transition-all duration-300 ease-in-out",
      "hover:scale-105 hover:shadow-lg hover:border-primary/50 hover:bg-card/50"
    )}
  >
    {/* Icon */}
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
      {icon}
    </div>
    {/* Title and Description */}
    <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
    <p className="mb-6 text-muted-foreground">{description}</p>
    {/* Benefits List */}
    <ul className="space-y-3">
      {benefits.map((benefit, index) => (
        <li key={index} className="flex items-center gap-3">
          <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
          <span className="text-muted-foreground text-sm">{benefit}</span>
        </li>
      ))}
    </ul>
  </div>
);

/**
 * A responsive "How It Works" section that displays a 3-step process.
 * It is styled with shadcn/ui theme variables to support light and dark modes.
 */
export const HowItWorks: React.FC<HowItWorksProps> = ({
  className,
  ...props
}) => {
  const stepsData = [
    {
      icon: <Wallet className="h-6 w-6" />,
      title: "Connect Wallet",
      description:
        "Link your digital wallet securely using WalletConnect or MetaMask. No KYC required for browsing.",
      benefits: [
        "Secure wallet integration",
        "Multiple wallet support",
        "Privacy-first approach",
      ],
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Browse & Invest",
      description:
        "Explore curated government bonds with real-time yield data. Invest with stablecoins starting at $100.",
      benefits: [
        "Real-time bond pricing",
        "Low minimum investment",
        "Transparent yield data",
      ],
    },
    {
      icon: <Coins className="h-6 w-6" />,
      title: "Earn & Trade",
      description:
        "Receive automatic interest payments in USDT. Trade your bond tokens anytime on our DEX.",
      benefits: [
        "Automatic interest distribution",
        "24/7 trading capability",
        "Instant liquidity",
      ],
    },
  ];

  return (
    <section
      id="how-it-works"
      className={cn("w-full py-24 px-4 relative overflow-hidden", className)}
      {...props}
    >
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary/10 blur-[120px] rounded-full -z-10 animate-glow-pulse" />
      <div
        className="absolute bottom-1/4 right-0 w-80 h-80 bg-secondary/10 blur-[140px] rounded-full -z-10 animate-glow-pulse"
        style={{ animationDelay: "2s" }}
      />

      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-6">
            The Process
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Start your investment journey in three simple steps
          </p>
        </div>

        {/* Step Indicators with Connecting Line */}
        <div className="relative mx-auto mb-8 w-full max-w-5xl">
          <div
            aria-hidden="true"
            className="absolute left-[16.6667%] top-1/2 h-0.5 w-[66.6667%] -translate-y-1/2 bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50"
          ></div>
          {/* Use grid to align numbers with the card grid below */}
          <div className="relative grid grid-cols-3">
            {stepsData.map((_, index) => (
              <div
                key={index}
                // Center the number within its grid column
                className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full bg-gradient-to-br from-primary to-secondary font-bold text-primary-foreground ring-4 ring-background"
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Steps Grid */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {stepsData.map((step, index) => (
            <StepCard
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              benefits={step.benefits}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
