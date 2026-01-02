"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SessionProvider, useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"

type User = {
  id: string;
  email: string;
  name?: string;
  image?: string;
  address?: string;
  walletAddress?: string;
  portfolio?: {
    totalInvested: number;
    currentValue: number;
    bonds: Array<{
      bondId: string;
      amount: number;
      purchaseDate: Date;
    }>;
  };
}

type AuthContextType = {
  user: User | null
  login: () => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = React.createContext<AuthContextType | null>(null)

function AuthProviderContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)

  React.useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.name || undefined,
        image: session.user.image || undefined,
        address: session.user.walletAddress || undefined,
        walletAddress: session.user.walletAddress,
        portfolio: session.user.portfolio,
      })
    } else {
      setUser(null)
    }
  }, [session])

  const login = async () => {
    // Redirect to login page
    router.push("/login")
  }

  const logout = async () => {
    await nextAuthSignOut({ redirect: true, callbackUrl: "/" })
  }

  const isLoading = status === "loading"

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderContent>{children}</AuthProviderContent>
    </SessionProvider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
