import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAuditLogs } from "@/hooks/useAuditLogs"

export function AuditLogs() {
    const { logs, isLoading } = useAuditLogs()

    return (
        <div className="rounded-xl border border-gray-800 bg-[#100F14] overflow-hidden">
            <div className="grid grid-cols-5 p-4 text-xs uppercase font-semibold text-gray-500 tracking-wider border-b border-gray-800 bg-black/20">
                <div>Timestamp</div>
                <div>Admin/User</div>
                <div>Action</div>
                <div>Status</div>
                <div>Bond ID</div>
            </div>
            <ScrollArea className="h-[250px]">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading blockchain activity...</div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No activity recorded yet.</div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="grid grid-cols-5 p-4 text-sm text-gray-300 border-b border-gray-800/50 hover:bg-white/5 transition-colors items-center">
                            <div className="text-gray-500 font-mono text-xs">{log.timestamp}</div>
                            <div className="font-medium text-xs text-blue-400 truncate pr-2" title={log.admin}>{log.admin}</div>
                            <div className="truncate pr-2" title={log.action}>{log.action}</div>
                            <div>
                                <Badge variant="outline" className="text-green-400 border-green-900 bg-green-900/10">
                                    {log.status}
                                </Badge>
                            </div>
                            <div className="font-mono text-xs text-gray-500">{log.bondId}</div>
                        </div>
                    ))
                )}
            </ScrollArea>
        </div>
    )
}
