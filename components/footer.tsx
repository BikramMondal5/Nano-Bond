import { Github, Twitter, Linkedin, Mail, Send } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="relative pt-20 pb-2 px-4 border-t border-border/50 bg-card/20 backdrop-blur-sm">
      {/* Background glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 blur-[150px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand section */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="relative w-10 h-10 shrink-0">
                <Image src="/logo.png" alt="NanoTreasury" fill className="object-contain" />
              </div>
              <span className="text-2xl font-bold text-foreground">NanoTreasury</span>
            </div>
            <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
              Democratizing access to government bonds through blockchain technology. Secure, transparent, and
              accessible to everyone.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-secondary hover:border-secondary/50 hover:bg-secondary/10 transition-all"
              >
                <Send className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-foreground font-semibold mb-6 text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-4 text-muted-foreground text-sm">
              <li>
                <a href="#features" className="hover:text-primary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-primary transition-colors">
                  How it Works
                </a>
              </li>
              <li>
                <a href="#roadmap" className="hover:text-primary transition-colors">
                  Roadmap
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  API Docs
                </a>
              </li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-foreground font-semibold mb-6 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-4 text-muted-foreground text-sm">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Compliance
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Risk Disclosure
                </a>
              </li>
            </ul>
          </div>

          {/* Contact links */}
          <div>
            <h4 className="text-foreground font-semibold mb-6 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-4 text-muted-foreground text-sm">
              <li>
                <a href="#faq" className="hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@nanotreasury.io"
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Support
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Media Kit
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar removed */}
      </div>
    </footer>
  )
}
