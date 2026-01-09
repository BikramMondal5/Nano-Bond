"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const formSchema = z.object({
    bondName: z.string().min(2, "Bond name is required"),
    bondId: z.string().min(2, "Bond ID is required"),
    issuer: z.string().min(2, "Issuer is required"),
    couponRate: z.string().regex(/^\d+(\.\d+)?$/, "Must be a valid percentage (e.g., 8.5)"),
    startDate: z.string().min(1, "Start date is required"),
    maturityDate: z.string().min(1, "Maturity date is required"),
    minInvestment: z.string().regex(/^\d+$/, "Must be a whole number"),
    maxSubscription: z.string().regex(/^\d+$/, "Must be a whole number"),
    description: z.string().optional(),
})

interface BondFormProps {
    onSuccess: () => void
}

import { useAccount } from 'wagmi'

export function BondForm({ onSuccess }: BondFormProps) {
    const { address } = useAccount()
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            bondName: "",
            bondId: "",
            issuer: "",
            couponRate: "",
            startDate: "",
            maturityDate: "",
            minInvestment: "",
            maxSubscription: "",
            description: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const payload = {
                ...values,
                adminWallet: address // Attach connected wallet
            }

            const response = await fetch('/api/bonds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create bond');
            }

            const data = await response.json();
            console.log("Bond Saved:", data);
            onSuccess();
        } catch (error) {
            console.error("Error submitting bond:", error);
            // Ideally use a toast notification here
            alert("Failed to save bond. Please check the console for details.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="bg-[#100F14] border-orange-500/20 shadow-lg shadow-orange-500/5">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                    Bond Details
                </CardTitle>
                <CardDescription className="text-gray-400">
                    Enter the core details for the new bond issuance.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <FormField
                                control={form.control}
                                name="bondName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            Bond Name <span className="text-[#FD8C00]">*</span>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger><Info className="w-3 h-3 text-gray-500" /></TooltipTrigger>
                                                    <TooltipContent>The display name of the bond product.</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. US Treasury 365D" {...field} className="bg-black/40 border-gray-800 focus:border-[#FD8C00] text-white placeholder:text-gray-600" />
                                        </FormControl>
                                        <FormMessage className="text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="bondId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            Bond ID <span className="text-[#FD8C00]">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Unique Internal ID" {...field} className="bg-black/40 border-gray-800 focus:border-[#FD8C00] text-white placeholder:text-gray-600" />
                                        </FormControl>
                                        <FormMessage className="text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="issuer"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            Issuer <span className="text-[#FD8C00]">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Authority Name" {...field} className="bg-black/40 border-gray-800 focus:border-[#FD8C00] text-white placeholder:text-gray-600" />
                                        </FormControl>
                                        <FormMessage className="text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="couponRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            Coupon Rate (%)
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="8.50" {...field} className="bg-black/40 border-gray-800 focus:border-[#FD8C00] text-white placeholder:text-gray-600" />
                                        </FormControl>
                                        <FormMessage className="text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            Start Date <span className="text-[#FD8C00]">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-black/40 border-gray-800 focus:border-[#FD8C00] text-white placeholder:text-gray-600" />
                                        </FormControl>
                                        <FormMessage className="text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="maturityDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            Maturity Date <span className="text-[#FD8C00]">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="bg-black/40 border-gray-800 focus:border-[#FD8C00] text-white placeholder:text-gray-600" />
                                        </FormControl>
                                        <FormMessage className="text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="minInvestment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            Min Investment (USDT)
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="100" {...field} className="bg-black/40 border-gray-800 focus:border-[#FD8C00] text-white placeholder:text-gray-600" />
                                        </FormControl>
                                        <FormMessage className="text-red-500" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="maxSubscription"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            Max Subscription (USDT)
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="1000000" {...field} className="bg-black/40 border-gray-800 focus:border-[#FD8C00] text-white placeholder:text-gray-600" />
                                        </FormControl>
                                        <FormMessage className="text-red-500" />
                                    </FormItem>
                                )}
                            />

                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-300 flex items-center gap-2">
                                        Bond Description
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Short description of the bond..." {...field} className="bg-black/40 border-gray-800 focus:border-[#FD8C00] text-white placeholder:text-gray-600 min-h-[100px]" />
                                    </FormControl>
                                    <FormMessage className="text-red-500" />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-[#FD8C00] hover:bg-[#E67E00] text-black font-bold uppercase tracking-wide px-8"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Bond
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
