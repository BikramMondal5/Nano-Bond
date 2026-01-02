"use client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

const logs = [
    { timestamp: "2024-03-20 14:30", admin: "admin_0x3a...9c", action: "Vault Trigger: Yield", status: "Success", bondId: "US365D" },
    { timestamp: "2024-03-20 12:15", admin: "admin_0x3a...9c", action: "Document Upload: Proof.pdf", status: "Success", bondId: "US365D" },
    { timestamp: "2024-03-20 12:10", admin: "admin_0x3a...9c", action: "Bond Created: US Treasury", status: "Success", bondId: "US365D" },
    { timestamp: "2024-03-19 09:45", admin: "super_admin", action: "System Update", status: "Pending", bondId: "-" },
    { timestamp: "2024-03-18 16:20", admin: "admin_0x1b...2a", action: "Maturity Settings Update", status: "Success", bondId: "UKGILT10" },
]

export function AuditLogs() {
    return (
        <div className="rounded-xl border border-gray-800 bg-[#100F14] overflow-hidden">
            <div className="grid grid-cols-5 p-4 text-xs uppercase font-semibold text-gray-500 tracking-wider border-b border-gray-800 bg-black/20">
                <div>Timestamp</div>
                <div>Admin</div>
                <div>Action</div>
                <div>Status</div>
                <div>Bond ID</div>
            </div>
            <ScrollArea className="h-[250px]">
                {logs.map((log, i) => (
                    <div key={i} className="grid grid-cols-5 p-4 text-sm text-gray-300 border-b border-gray-800/50 hover:bg-white/5 transition-colors items-center">
                        <div className="text-gray-500 font-mono text-xs">{log.timestamp}</div>
                        <div className="font-medium text-xs text-blue-400">{log.admin}</div>
                        <div>{log.action}</div>
                        <div>
                            <Badge variant="outline" className={log.status === "Success" ? "text-green-400 border-green-900 bg-green-900/10" : "text-yellow-400 border-yellow-900 bg-yellow-900/10"}>
                                {log.status}
                            </Badge>
                        </div>
                        <div className="font-mono text-xs text-gray-500">{log.bondId}</div>
                    </div>
                ))}
            </ScrollArea>
        </div>
    )
}
