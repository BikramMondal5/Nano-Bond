"use client"

import type React from "react"
import { useState, Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { MatrixRain } from "@/components/cyber-hero"
import { Shield, User, Mail, Lock, ArrowRight, Github } from "lucide-react"

function SignUpFormContent() {
  const searchParams = useSearchParams()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) setError("Registration failed. Please try again.")
  }, [searchParams])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setTimeout(() => {
      setIsLoading(false)
      setError("Registration is locked in demo mode.")
    }, 1500)
  }

  return (
    <div className="w-full max-w-lg">
      <div className="relative backdrop-blur-xl bg-orange-950/10 border border-orange-500/20 rounded-3xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-3xl -z-10" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4">
            <Shield className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Agent Registration</h2>
          <p className="mt-2 text-orange-200/50">Join the elite cybersecurity simulation squad.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-orange-300 uppercase tracking-wider ml-1">First Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/50 group-focus-within:text-orange-400 transition-colors" />
                <Input
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="pl-10 h-12 bg-orange-950/20 border-orange-500/20 focus:border-orange-500/50 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-orange-300 uppercase tracking-wider ml-1">Last Name</label>
              <Input
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="h-12 bg-orange-950/20 border-orange-500/20 focus:border-orange-500/50 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-orange-300 uppercase tracking-wider ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/50 group-focus-within:text-orange-400 transition-colors" />
              <Input
                type="email"
                placeholder="agent@nexus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 h-12 bg-orange-950/20 border-orange-500/20 focus:border-orange-500/50 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-orange-300 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/50 group-focus-within:text-orange-400 transition-colors" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 h-12 bg-orange-950/20 border-orange-500/20 focus:border-orange-500/50 text-white"
              />
            </div>
            <p className="text-[10px] text-orange-200/30 uppercase tracking-widest px-1">
              Requires: 8+ Chars, Mixed Case, Symbols
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-orange-500/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-orange-950/10 px-2 text-orange-300/60">Or continue with</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-orange-500/30 text-orange-200 hover:bg-orange-950/40 rounded-xl bg-transparent flex items-center justify-center gap-3"
              onClick={() => {
                /* TODO: Implement Google OAuth */
              }}
            >
              <img src="/google-logo.png" alt="Google" className="w-5 h-5" />
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-orange-500/30 text-orange-200 hover:bg-orange-950/40 rounded-xl bg-transparent flex items-center justify-center gap-3"
              onClick={() => {
                /* TODO: Implement GitHub OAuth */
              }}
            >
              <Github className="w-5 h-5" />
              Continue with GitHub
            </Button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] mt-4"
          >
            {isLoading ? "Provisioning..." : "Create Identity"}
            {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-orange-200/40">Already cleared?</span>{" "}
          <Link href="/login" className="text-orange-400 hover:text-orange-300 font-bold transition-colors">
            Authorize Session
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      <Navbar />
      <MatrixRain opacity={0.25} speed={0.5} />
      <div className="flex-1 flex relative z-10">
        {/* Left Side - Image Container */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=2070"
              alt="Network Security Graph"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-orange-950/80 via-orange-900/70 to-black/60" />
          </div>
          <div className="relative z-10 max-w-lg">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-orange-500/20 border-2 border-orange-500/30 mb-6">
                <Shield className="w-12 h-12 text-orange-400" />
              </div>
              <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-orange-300 to-amber-400">
                Join the Elite Squad
              </h1>
              <p className="text-lg text-orange-200/60 leading-relaxed">
                Register to access cutting-edge threat intelligence and autonomous defense capabilities. Be part of the
                next generation of cybersecurity.
              </p>
            </div>
            <div className="space-y-4 text-sm text-orange-200/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Predictive attack simulations</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Advanced threat analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>24/7 SOC dashboard access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Container */}
        <div className="w-full lg:w-1/2 flex items-start justify-center p-6 overflow-y-auto scrollbar-hide">
          <Suspense
            fallback={<div className="text-orange-400 animate-pulse font-mono">INITIALIZING AGENT UPLINK...</div>}
          >
            <SignUpFormContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
