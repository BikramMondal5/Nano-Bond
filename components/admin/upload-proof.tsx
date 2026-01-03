"use client"

import { useState, useRef } from "react"
import { Upload, FileText, CheckCircle, Copy, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAdminActions } from "@/hooks/useAdminActions"

interface UploadProofProps {
    enabled: boolean
    onSuccess: () => void
}

export function UploadProof({ enabled, onSuccess }: UploadProofProps) {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [uploadedHash, setUploadedHash] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { addAsset, hash, isPending } = useAdminActions()

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0]
            if (selected.type !== "application/pdf") {
                toast.error("Only PDF files are allowed.")
                return
            }
            setFile(selected)
            setUploadedHash(null)
            setProgress(0)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!enabled) return

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const selected = e.dataTransfer.files[0]
            if (selected.type !== "application/pdf") {
                toast.error("Only PDF files are allowed.")
                return
            }
            setFile(selected)
            setUploadedHash(null)
            setProgress(0)
        }
    }

    const startUpload = async () => {
        if (!file) return
        setUploading(true)
        setProgress(0)

        // Simulate upload process
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval)
                    return 100
                }
                return prev + 10
            })
        }, 200)

        await new Promise((resolve) => setTimeout(resolve, 2500))
        clearInterval(interval)
        setProgress(100)

        const mockHash = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
        setUploadedHash(mockHash)
        setUploading(false)
        toast.success("Document uploaded successfully to IPFS")
    }

    const clearFile = () => {
        setFile(null)
        setUploadedHash(null)
        setProgress(0)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const copyHash = () => {
        if (uploadedHash) {
            navigator.clipboard.writeText(uploadedHash)
            toast.success("IPFS Hash copied to clipboard")
        }
    }

    return (
        <Card className={cn(
            "bg-[#100F14] border-orange-500/20 transition-all duration-500 select-none",
            !enabled && "opacity-40 grayscale pointer-events-none"
        )}>
            <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
                    <span>Upload Bond Proof Document</span>
                    {!enabled && <span className="text-xs uppercase bg-gray-800 text-gray-400 px-2 py-1 rounded">Locked</span>}
                </CardTitle>
                <CardDescription className="text-gray-400">
                    Upload PDF documentation (proof of purchase/legal receipts) to enable vault controls.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">

                    {/* Drop Zone */}
                    {!file && !uploadedHash && (
                        <div
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-700 hover:border-[#FD8C00] rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer transition-colors bg-black/20 group"
                        >
                            <div className="p-4 rounded-full bg-gray-800 group-hover:bg-[#FD8C00]/10 mb-4 transition-colors">
                                <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#FD8C00]" />
                            </div>
                            <p className="text-gray-300 font-medium">Drag & Drop or <span className="text-[#FD8C00] underline">Browse</span></p>
                            <p className="text-gray-500 text-sm mt-2">PDF only, max 10MB</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="application/pdf"
                                onChange={handleFileSelect}
                            />
                        </div>
                    )}

                    {/* File Preview & Upload Status */}
                    {file && (
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/10 rounded-lg">
                                        <FileText className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{file.name}</p>
                                        <p className="text-gray-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                {!uploading && !uploadedHash && (
                                    <Button variant="ghost" size="icon" onClick={clearFile} className="text-gray-500 hover:text-red-500">
                                        <X className="w-5 h-5" />
                                    </Button>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {(uploading || uploadedHash) && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>{uploadedHash ? "Uploaded to IPFS" : "Uploading..."}</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2 bg-gray-800" indicatorClassName={uploadedHash ? "bg-green-500" : "bg-[#FD8C00]"} />
                                </div>
                            )}

                            {/* Actions */}
                            {!uploading && !uploadedHash && (
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={startUpload} className="bg-[#FD8C00] hover:bg-[#E67E00] text-black font-semibold">
                                        Start Upload
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Post Upload Verification */}
                    {uploadedHash && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">IPFS Hash (Proof)</label>
                                <div className="flex gap-2">
                                    <Input value={uploadedHash} readOnly className="bg-black/40 border-green-900/50 text-green-400 font-mono text-sm" />
                                    <Button variant="outline" size="icon" onClick={copyHash} className="border-gray-800 hover:bg-gray-800">
                                        <Copy className="w-4 h-4 text-gray-400" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={() => {
                                        if (uploadedHash) addAsset(uploadedHash, "100000")
                                        // Ideally wait for tx, but for UI flow:
                                        onSuccess()
                                    }}
                                    disabled={isPending}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold w-full md:w-auto"
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    {isPending ? "Confirming..." : "Submit On-Chain"}
                                </Button>
                            </div>
                            {hash && <p className="text-xs text-gray-500 text-right mt-1 font-mono">Tx: {hash}</p>}
                        </div>
                    )}

                </div>
            </CardContent>
        </Card>
    )
}
