"use client"

import Image from "next/image"

import type React from "react"
import { useState, Suspense, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { MatrixRain } from "@/components/cyber-hero"
import { Shield, User, Mail, Lock, ArrowRight, Github, Wallet, Rocket, Loader2 } from "lucide-react"
import { useWeb3Auth } from "@/hooks/use-web3auth"

function SignUpFormContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
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

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          firstName,
          lastName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registration failed")
        return
      }

      // Auto sign in after successful registration
      const signInResult = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: false,
      })

      if (signInResult?.ok) {
        router.push("/portfolio")
      } else {
        router.push("/login?registered=true")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const { login, isInitializing } = useWeb3Auth()

  const handleWeb3SignUp = async () => {
    setIsLoading(true)
    try {
      const result = await login()
      if (result && result.user && result.user.email) {
        const signInResult = await signIn("credentials", {
          web3auth_email: result.user.email,
          web3auth_name: result.user.name,
          wallet_address: result.address,
          redirect: false,
        })

        if (signInResult?.ok) {
          router.push("/portfolio")
        } else {
          setError("Failed to create session with Web3Auth")
        }
      } else {
        setError("Web3Auth login failed or no email provided")
      }
    } catch (error) {
      console.error(error)
      setError("Failed to sign up with Web3Auth")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="relative backdrop-blur-xl bg-orange-950/10 border border-orange-500/20 rounded-3xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-3xl -z-10" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4">
            <Rocket className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Create Your Account</h2>
          <p className="mt-2 text-orange-200/50">Start investing in tokenized government bonds today</p>
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
                placeholder="investor@govtbond.com"
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
              onClick={handleWeb3SignUp}
              disabled={isLoading || isInitializing}
            >
              {isInitializing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wallet className="w-5 h-5" />
              )}
              Continue with Web3Auth
            </Button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] mt-4"
          >
            {isLoading ? "Creating account..." : "Start Investing"}
            {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-orange-200/40">Already have an account?</span>{" "}
          <Link href="/login" className="text-orange-400 hover:text-orange-300 font-bold transition-colors">
            Sign In
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
      <div className="flex-1 flex relative z-10 overflow-hidden">
        {/* Left Side - Image Container */}
        <div className="hidden lg:flex lg:w-1/2 fixed left-0 top-0 h-screen items-center justify-center p-12 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/sign-up-banner.jpeg"
              alt="Bond Portfolio Investment"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-orange-950/80 via-orange-900/70 to-black/60" />
          </div>
          <div className="relative z-10 max-w-lg">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-orange-500/20 border-2 border-orange-500/30 mb-6">
                <Rocket className="w-12 h-12 text-orange-400" />
              </div>
              <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-orange-300 to-amber-400">
                Build Your Bond Portfolio
              </h1>
              <p className="text-lg text-orange-200/60 leading-relaxed">
                Join thousands of investors accessing government bonds through blockchain technology. Earn stable returns with complete transparency and security.
              </p>
            </div>
            <div className="space-y-4 text-sm text-orange-200/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Start with as little as $10</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Bank-grade security & transparency</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>24/7 portfolio access & management</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Container */}
        <div className="w-full lg:w-1/2 lg:ml-[50%] flex items-start justify-center p-6 py-24 overflow-y-auto scrollbar-hide min-h-screen">
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
