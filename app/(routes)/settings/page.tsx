"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Shield, Wallet, LogOut } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="text-muted-foreground mt-2">Manage your account preferences and security.</p>
                </div>
            </div>

            <div className="grid gap-6 max-w-4xl">
                {/* Notifications */}
                <Card className="bg-[#100F14] border-white/5">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary" />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>Control how you receive alerts and updates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="email-alerts" className="text-base text-gray-200">Email Alerts</Label>
                            <Switch id="email-alerts" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="price-alerts" className="text-base text-gray-200">Price Volatility Alerts</Label>
                            <Switch id="price-alerts" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="marketing" className="text-base text-gray-200">Product Updates</Label>
                            <Switch id="marketing" defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card className="bg-[#100F14] border-white/5">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <CardTitle>Security</CardTitle>
                        </div>
                        <CardDescription>Manage your wallet connection and privacy.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Connected Wallet</Label>
                            <div className="flex items-center gap-2">
                                <Input value="0x89...2d14" readOnly className="bg-[#1C1A21] border-white/10" />
                                <Button variant="outline" size="icon" className="shrink-0 border-white/10 hover:bg-white/5">
                                    <LogOut className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <Label htmlFor="public-profile" className="text-base text-gray-200">Public Profile</Label>
                            <Switch id="public-profile" />
                        </div>
                    </CardContent>
                </Card>

                {/* Wallet Defaults */}
                <Card className="bg-[#100F14] border-white/5">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-primary" />
                            <CardTitle>Payment Defaults</CardTitle>
                        </div>
                        <CardDescription>Set default values for quicker transactions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Currency</Label>
                            <Input value="USDT (Tether)" disabled className="bg-[#1C1A21] border-white/10 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button className="font-bold bg-primary hover:bg-primary/90 text-white px-8">
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    )
}
