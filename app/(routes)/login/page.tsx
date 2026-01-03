"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { MatrixRain } from "@/components/cyber-hero"
import { Shield, Lock, Mail, ArrowRight, Github, Wallet } from "lucide-react"

function LoginFormContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "no_account") setError("No account exists with this credentials.")
    else if (errorParam === "OAuthAccountNotLinked") setError("Email already in use with different provider.")
    else if (errorParam === "CredentialsSignin") setError("Invalid email or password.")
    else if (errorParam) setError("Authentication failed. Please try again.")
  }, [searchParams])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        router.push("/portfolio")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl: "/portfolio" })
    } catch (error) {
      setError("Failed to sign in with Google")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="relative backdrop-blur-xl bg-orange-950/10 border border-orange-500/20 rounded-3xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-3xl -z-10" />

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4">
            <Shield className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-orange-200/50">Access your tokenized bond portfolio</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-5">
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
                className="pl-10 h-12 bg-orange-950/20 border-orange-500/20 focus:border-orange-500/50 focus:ring-orange-500/20 text-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-orange-300 uppercase tracking-wider ml-1">Password</label>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/50 group-focus-within:text-orange-400 transition-colors" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 h-12 bg-orange-950/20 border-orange-500/20 focus:border-orange-500/50 focus:ring-orange-500/20 text-white transition-all"
              />
            </div>
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
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <img src="/google-logo.png" alt="Google" className="w-5 h-5" />
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-orange-500/30 text-orange-200 hover:bg-orange-950/40 rounded-xl bg-transparent flex items-center justify-center gap-3"
              onClick={() => {
                /* TODO: Implement Metamask connection */
              }}
              disabled={isLoading}
            >
              <img src="/MetaMask-logo.png" alt="MetaMask" className="w-5 h-5" />
              Continue with Metamask
            </Button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
          >
            {isLoading ? "Signing in..." : "Sign In to Portfolio"}
            {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
          </Button>
        </form>

        <div className="mt-10 text-center text-sm">
          <span className="text-orange-200/40">New investor?</span>{" "}
          <Link href="/sign-up" className="text-orange-400 hover:text-orange-300 font-bold transition-colors">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      <Navbar />
      <MatrixRain opacity={0.25} speed={0.5} />
      <div className="flex-1 flex relative z-10 overflow-hidden">
        {/* Left Side - Image Container */}
        <div className="hidden lg:flex lg:w-1/2 fixed left-0 top-0 h-screen items-center justify-center p-12 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/a-clean-3d-illustration-featuring-a-poli_LGz4tTIWT5mjAhAIXmRP1A_FjVoipGKQ6-nmpV1SiOP3Q.jpeg"
              alt="Government Bonds Investment"
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
                Government Bonds, Tokenized
              </h1>
              <p className="text-lg text-orange-200/60 leading-relaxed">
                Invest in secure, government-backed bonds with blockchain transparency. Start building your portfolio with as little as $10.
              </p>
            </div>
            <div className="space-y-4 text-sm text-orange-200/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Fractional ownership of government bonds</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Real-time portfolio tracking & analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Transparent blockchain-secured transactions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Container */}
        <div className="w-full lg:w-1/2 lg:ml-[50%] flex items-start justify-center p-6 py-24 overflow-y-auto scrollbar-hide min-h-screen">
          <Suspense
            fallback={<div className="text-orange-400 animate-pulse font-mono">INITIALIZING SECURE LINK...</div>}
          >
            <LoginFormContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
