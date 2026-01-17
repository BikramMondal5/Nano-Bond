"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Rocket, Wallet, Loader2, ArrowRight } from "lucide-react"
import { useWeb3Auth } from "@/hooks/use-web3auth"
import { useContentTranslation } from "@/hooks/useContentTranslation"

export default function SignUpFormContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const content = useContentTranslation({
        title: "Create Your Account",
        subtitle: "Start investing in tokenized government bonds today",
        btn_web3: "Continue with Web3Auth",
        btn_creating: "Creating account...",
        already_have: "Already have an account?",
        sign_in: "Sign In",
        web3_desc: "Securely create your account using Web3Auth. No password needed."
    })

    useEffect(() => {
        const errorParam = searchParams.get("error")
        if (errorParam) setError("Registration failed. Please try again.")
    }, [searchParams])

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
                    // Force a hard navigation to ensure session cookies are picked up immediately
                    window.location.href = "/portfolio";
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

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4">
                        <Rocket className="w-8 h-8 text-orange-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{content.title}</h2>
                    <p className="mt-2 text-orange-200/50">{content.subtitle}</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    <p className="text-center text-sm text-orange-200/60 leading-relaxed px-4">
                        {content.web3_desc}
                    </p>

                    <Button
                        type="button"
                        className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        onClick={handleWeb3SignUp}
                        disabled={isLoading || isInitializing}
                    >
                        {isInitializing || isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Wallet className="w-5 h-5" />
                        )}
                        {isLoading ? content.btn_creating : content.btn_web3}
                        {!isLoading && !isInitializing && <ArrowRight className="w-5 h-5" />}
                    </Button>
                </div>

                <div className="mt-10 text-center text-sm">
                    <span className="text-orange-200/40">{content.already_have}</span>{" "}
                    <Link href="/login" className="text-orange-400 hover:text-orange-300 font-bold transition-colors">
                        {content.sign_in}
                    </Link>
                </div>
            </div>
        </div>
    )
}
