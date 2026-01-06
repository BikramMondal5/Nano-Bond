"use client"

import { useState, useRef } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useSignMessage } from "wagmi"

export default function KYCPage() {
  const { address } = useAccount()
  const router = useRouter()
  const { signMessageAsync } = useSignMessage()

  const [step, setStep] = useState(1)
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)  // Removed selfieFile
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const videoRef = useRef<HTMLVideoElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const handleAadhaarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAadhaarFile(e.target.files[0])
      setStep(2)  // Go directly to video step
    }
  }

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const file = new File([blob], "liveness.webm", { type: "video/webm" })
        setVideoFile(file)
        stream.getTracks().forEach(track => track.stop())
        setStep(3)  // Go to review step
      }

      recorder.start()
      setIsRecording(true)
      setCountdown(5)

      // Countdown timer
      const countInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Stop after 5 seconds
      setTimeout(() => {
        recorder.stop()
        setIsRecording(false)
        clearInterval(countInterval)
      }, 5000)

    } catch (err) {
      setError("Camera access denied. Please allow camera access.")
    }
  }

  const submitKYC = async () => {
    if (!address || !aadhaarFile || !videoFile) {
      setError("Please upload Aadhaar and record liveness video")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const message = `I authorize KYC verification for wallet ${address}`
      const signature = await signMessageAsync({ message })

      const formData = new FormData()
      formData.append('aadhaar', aadhaarFile)
      formData.append('video', videoFile)  // Only video, no selfie
      formData.append('walletAddress', address)
      formData.append('walletSignature', signature)
      formData.append('signedMessage', message)

      const response = await axios.post('/api/kyc/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000  // 2 minutes
      })

      setResult(response.data)
      setStep(4)  // Results step

    } catch (err: any) {
      console.error('KYC Error:', err)
      setError(err.response?.data?.error || err.message || "KYC submission failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Alert className="bg-[#100F14] border-primary/20">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <AlertDescription>
            Please connect your wallet to start KYC verification.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="text-center space-y-4 mb-12">
        <div className="flex justify-center mb-6">
          <Badge
            variant="outline"
            className="px-4 py-1.5 border-primary/30 bg-primary/5 text-primary gap-2 text-sm font-medium"
          >
            <ShieldCheck className="w-4 h-4" />
            KYC Verification
          </Badge>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Identity Verification
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          AI-powered verification in 2 simple steps. Complete KYC to start investing in government bonds.
        </p>
      </div>

      {/* Progress Indicator - 3 verification steps */}
      <div className="flex justify-center mb-12 gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-2 w-20 rounded-full transition-all duration-300 ${s <= step && step <= 3 ? 'bg-primary' : 'bg-border/50'
              }`}
          />
        ))}
      </div>

      {/* Step 1: Upload Aadhaar */}
      {step === 1 && (
        <Card className="bg-[#100F14] border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl">Step 1: Upload Aadhaar Card</CardTitle>
            <CardDescription className="text-base">
              Take a clear photo of your Aadhaar card (front side)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-primary/20 rounded-2xl cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all duration-300">
              <Upload className="w-12 h-12 text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Click to upload Aadhaar</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAadhaarUpload}
              />
            </label>
            {aadhaarFile && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {aadhaarFile.name}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Record Liveness Video */}
      {step === 2 && (
        <Card className="bg-[#100F14] border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl">Step 2: Liveness Verification</CardTitle>
            <CardDescription className="text-base">
              Record a 5-second video. Blink naturally and turn your head slightly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-2xl bg-black border border-border/50"
              />
              {isRecording && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl font-bold text-white bg-black/50 rounded-full w-24 h-24 flex items-center justify-center">
                    {countdown}
                  </div>
                </div>
              )}
            </div>

            <Alert className="bg-blue-500/10 border-blue-500/20">
              <AlertDescription className="text-sm text-blue-300">
                Tips: Ensure good lighting, face the camera directly, and make natural movements (blink, slight head turn).
              </AlertDescription>
            </Alert>

            <Button
              onClick={startVideoRecording}
              disabled={isRecording}
              className="w-full"
            >
              {isRecording ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording... ({countdown}s remaining)
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Start 5-Second Recording
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <Card className="bg-[#100F14] border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl">Step 3: Review & Submit</CardTitle>
            <CardDescription className="text-base">
              Verify your documents before submission
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-background border border-border/50 rounded-lg">
                <span className="text-sm font-medium">Aadhaar Card</span>
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center justify-between p-4 bg-background border border-border/50 rounded-lg">
                <span className="text-sm font-medium">Liveness Video (5s)</span>
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
            </div>

            <Alert className="bg-primary/5 border-primary/20">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm text-muted-foreground">
                By submitting, you confirm that the documents are authentic and belong to you.
                AI verification will process your KYC in under 60 seconds.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive" className="bg-destructive/10">
                <XCircle className="h-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={submitKYC}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing KYC...
                </>
              ) : (
                'Submit for Verification'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Result */}
      {step === 4 && result && (
        <Card className="bg-[#100F14] border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              {result.status === 'APPROVED' ? (
                <>
                  <CheckCircle2 className="w-7 h-7 text-green-500" />
                  KYC Approved!
                </>
              ) : (
                <>
                  <XCircle className="w-7 h-7 text-red-500" />
                  KYC Rejected
                </>
              )}
            </CardTitle>
            <CardDescription className="text-base">
              {result.status === 'APPROVED'
                ? 'You can now invest in government bonds'
                : 'Please review the rejection reason below'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {result.status === 'APPROVED' ? (
              <div className="space-y-4">
                <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl">
                  <p className="text-sm text-green-400 mb-2">
                    Your identity has been verified and registered on-chain.
                  </p>
                  <p className="text-xs text-green-300">
                    Valid until: {result.expiresAt ? new Date(result.expiresAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/invest')}
                  className="w-full"
                >
                  Start Investing
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                  <AlertDescription>
                    <strong>Reason:</strong> {result.rejectionReason}
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => {
                    setStep(1)
                    setAadhaarFile(null)
                    setVideoFile(null)
                    setResult(null)
                    setError("")
                  }}
                  variant="outline"
                  className="w-full border-border/50 hover:bg-primary/5"
                >
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trust & Security Section */}
      <section className="mt-16 p-8 rounded-2xl bg-[#100F14] border border-primary/10">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-1 space-y-2">
            <h2 className="text-xl font-bold">Trust & Security</h2>
            <p className="text-sm text-muted-foreground">Why you can invest with absolute confidence.</p>
          </div>
          <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
            {[
              "End-to-end encryption for all document uploads",
              "AI verification completes in under 60 seconds",
              "Video-based liveness prevents deepfakes",
              "Blockchain-based identity tied to your wallet address",
            ].map((note, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground leading-tight">{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}