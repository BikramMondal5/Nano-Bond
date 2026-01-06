"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldCheck, XCircle, Clock, AlertTriangle } from "lucide-react"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import axios from "axios"

export function KYCVerificationStatus() {
  const { address } = useAccount()
  const router = useRouter()
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (address) {
      fetchKYCStatus()
    }
  }, [address])

  const fetchKYCStatus = async () => {
    try {
      const response = await axios.get(`/api/kyc/status/${address}`)
      setStatus(response.data)
    } catch (error) {
      console.error("Failed to fetch KYC status:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-[#100F14] border-primary/20">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Clock className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading KYC status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status || status.status === 'NOT_SUBMITTED') {
    return (
      <Card className="bg-[#100F14] border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            KYC Verification Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              You must complete KYC verification before investing in government bonds.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push('/kyc')}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Start KYC Verification
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (status.status === 'APPROVED' && status.isVerified) {
    return (
      <Card className="bg-[#100F14] border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            KYC Verified
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-sm text-green-400">
              Your identity is verified and active.
            </p>
            <p className="text-xs text-green-300 mt-1">
              Valid until: {status.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Risk Score</span>
              <p className="text-white font-medium">{status.riskScore}/100</p>
            </div>
            <div>
              <span className="text-muted-foreground">Verified On</span>
              <p className="text-white font-medium">
                {status.submittedAt ? new Date(status.submittedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status.status === 'PENDING') {
    return (
      <Card className="bg-[#100F14] border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            KYC Processing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Your KYC is being processed by our AI system. This usually takes under 60 seconds.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (status.status === 'REJECTED') {
    return (
      <Card className="bg-[#100F14] border-red-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            KYC Rejected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Your KYC verification was rejected. Please review and resubmit.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push('/kyc')}
            variant="outline"
            className="w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (status.status === 'EXPIRED' || status.reKycRequired) {
    return (
      <Card className="bg-[#100F14] border-orange-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            KYC Expired
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Your KYC verification has expired. Please re-verify to continue investing.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push('/kyc')}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Re-verify Identity
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}