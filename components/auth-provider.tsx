"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"

type User = {
  address: string
}

type AuthContextType = {
  user: User | null
  login: () => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Simulate persistent login state check
  React.useEffect(() => {
    const savedUser = localStorage.getItem("gb_user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = () => {
    const mockUser = { address: "0xAb34...1aF9" }
    setUser(mockUser)
    localStorage.setItem("gb_user", JSON.stringify(mockUser))

    // Redirect to portfolio after login as per requirements
    router.push("/portfolio")
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("gb_user")
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
