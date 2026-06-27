"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Shield, Wallet, Loader2, ArrowRight } from "lucide-react"
import { useWeb3Auth } from "@/hooks/use-web3auth"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export default function LoginFormContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const [error, setError] = useState("")

    const content = useContentTranslation({
        title: "Welcome Back",
        subtitle: "Access your tokenized bond portfolio",
        web3_desc: "Securely access your account using Web3Auth. No password needed.",
        btn_web3: "Continue with Web3Auth",
        btn_signing: "Signing in...",
        new_investor: "New investor?",
        create_account: "Create Account"
    });

    useEffect(() => {
        const errorParam = searchParams.get("error")
        if (errorParam === "no_account") setError("No account exists with this credentials.")
        else if (errorParam === "OAuthAccountNotLinked") setError("Email already in use with different provider.")
        else if (errorParam === "CredentialsSignin") setError("Invalid email or password.")
        else if (errorParam) setError("Authentication failed. Please try again.")
    }, [searchParams])

    const { login, isInitializing } = useWeb3Auth()

    const handleWeb3SignIn = async () => {
        try {
            // Trigger login immediately synchronously to prevent popup blockers!
            const result = await login()
            // Set loading state AFTER popup has opened successfully
            setIsLoading(true)
            
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
            setError("Failed to sign in with Web3Auth")
        } finally {
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
                    <h2 className="text-3xl font-bold text-white tracking-tight">{content.title}</h2>
                    <p className="mt-2 text-orange-200/50">{content.subtitle}</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <div className="space-y-5">
                    <p className="text-center text-sm text-orange-200/60 leading-relaxed px-4">
                        {content.web3_desc}
                    </p>

                    <Button
                        type="button"
                        className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        onClick={handleWeb3SignIn}
                        disabled={isLoading || isInitializing}
                    >
                        {isInitializing || isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Wallet className="w-5 h-5" />
                        )}
                        {isLoading ? content.btn_signing : content.btn_web3}
                        {!isLoading && !isInitializing && <ArrowRight className="w-5 h-5" />}
                    </Button>
                </div>

                <div className="mt-10 text-center text-sm">
                    <span className="text-orange-200/40">{content.new_investor}</span>{" "}
                    <Link href="/sign-up" className="text-orange-400 hover:text-orange-300 font-bold transition-colors">
                        {content.create_account}
                    </Link>
                </div>
            </div>
        </div>
    )
}
