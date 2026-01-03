"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BondForm } from "@/components/admin/bond-form"
import { UploadProof } from "@/components/admin/upload-proof"
import { VaultControls } from "@/components/admin/vault-controls"
import { AuditLogs } from "@/components/admin/audit-logs"

export default function AdminPage() {
    const [bondCreated, setBondCreated] = useState(false)
    const [proofUploaded, setProofUploaded] = useState(false)

    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0A] p-6 lg:p-8 space-y-12 max-w-7xl mx-auto w-full pb-20">

            {/* Header / Title */}
            <div className="space-y-1 animate-in fade-in slide-in-from-top-4 duration-500">
                <h1 className="text-3xl font-bold text-white tracking-tight">Admin Control Panel</h1>
                <p className="text-gray-400">Create new bonds, upload proof documents, and manage vault configurations.</p>
            </div>

            {/* Bond Creation Form */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <BondForm onSuccess={() => setBondCreated(true)} />
            </section>

            {/* Upload Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                <div className="mb-6 flex items-center gap-4">
                    <div className="h-px bg-gray-800 flex-1" />
                    <span className={`text-xs uppercase font-semibold tracking-wider ${bondCreated ? "text-[#FD8C00]" : "text-gray-600"}`}>
                        Step 2: Asset Verification
                    </span>
                    <div className="h-px bg-gray-800 flex-1" />
                </div>
                <UploadProof enabled={bondCreated} onSuccess={() => setProofUploaded(true)} />
            </section>

            {/* Vault Controls */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <div className="mb-6 flex items-center gap-4">
                    <div className="h-px bg-gray-800 flex-1" />
                    <span className={`text-xs uppercase font-semibold tracking-wider ${proofUploaded ? "text-[#FD8C00]" : "text-gray-600"}`}>
                        Step 3: Vault Controls
                    </span>
                    <div className="h-px bg-gray-800 flex-1" />
                </div>
                <VaultControls enabled={proofUploaded} />
            </section>

            {/* Logs */}
            <section className="pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Audit & Activity Logs</h3>
                    <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">Real-time</span>
                </div>
                <AuditLogs />
            </section>
        </div>
    )
}
