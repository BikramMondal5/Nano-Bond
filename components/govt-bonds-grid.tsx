"use client"

import { motion } from "framer-motion"
import { Calendar, TrendingUp, DollarSign, FileText } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { IBond } from "@/lib/models/Bond"
import { useContentTranslation } from "@/hooks/useContentTranslation"

interface GovtBondsGridProps {
    bonds: (IBond & { _id: string })[];
    basePath?: string;
}

export function GovtBondsGrid({ bonds, basePath = "/govt-bonds" }: GovtBondsGridProps) {
    const content = useContentTranslation({
        no_bonds_title: "No Bonds Available",
        no_bonds_desc: "There are currently no government bonds listed. Please check back later when new assets are released.",
        bond_type_tag: "Govt Bond",
        label_coupon: "Coupon Rate",
        label_min_invest: "Min Best",
        label_start_date: "Start Date",
        label_maturity: "Maturity",
        btn_view_details: "View Details",
    });

    if (!bonds || bonds.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-[#1A1A1A] p-4 rounded-full mb-4">
                    <FileText className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{content.no_bonds_title}</h3>
                <p className="text-gray-400 max-w-md">
                    {content.no_bonds_desc}
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bonds.map((bond, index) => (
                <motion.div
                    key={bond._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                    <Card className="relative bg-[#100F14] border-gray-800 hover:border-[#FD8C00]/50 transition-colors duration-300 h-full flex flex-col group overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#FD8C00] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs font-mono uppercase tracking-wider">
                                    {bond.bondId}
                                </Badge>
                                <Badge className="bg-[#FD8C00]/10 text-[#FD8C00] border-[#FD8C00]/20 hover:bg-[#FD8C00]/20">
                                    {content.bond_type_tag}
                                </Badge>
                            </div>
                            <CardTitle className="text-xl font-bold text-white group-hover:text-[#FD8C00] transition-colors">
                                {bond.bondName}
                            </CardTitle>
                            <CardDescription className="text-gray-400 font-medium">
                                {bond.issuer}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex-1 space-y-4">
                            {bond.description && (
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                    {bond.description}
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" /> {content.label_coupon}
                                    </span>
                                    <p className="text-lg font-semibold text-white">
                                        {bond.couponRate}%
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" /> {content.label_min_invest}
                                    </span>
                                    <p className="text-lg font-semibold text-white">
                                        ${bond.minInvestment}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {content.label_start_date}
                                    </span>
                                    <p className="text-sm font-medium text-gray-300">
                                        {format(new Date(bond.startDate), "MMM d, yyyy")}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {content.label_maturity}
                                    </span>
                                    <p className="text-sm font-medium text-gray-300">
                                        {format(new Date(bond.maturityDate), "MMM d, yyyy")}
                                    </p>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="pt-4 border-t border-gray-800/50">
                            <Button className="w-full bg-[#FD8C00] hover:bg-[#FD8C00]/90 text-white font-bold" onClick={() => window.location.href = `${basePath}/${bond.bondId}`}>
                                {content.btn_view_details}
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            ))}
        </div>
    )
}
