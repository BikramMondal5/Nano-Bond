"use client"

import { BondList } from "@/components/admin/bond-list"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminBondsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0A] p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Your Bonds</h1>
                    <p className="text-gray-400">View and manage the bonds you have issued.</p>
                </div>
            </div>

            {/* List */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <BondList />
            </section>
        </div>
    )
}
