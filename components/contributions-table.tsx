import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const contributions = [
  { date: "Dec 12, 2025", amount: "5,000 USDT", share: "2.0%", currentValue: "5,450 USDT", rewards: "450 USDT" },
  { date: "Nov 05, 2025", amount: "3,500 USDT", share: "1.4%", currentValue: "3,820 USDT", rewards: "320 USDT" },
  { date: "Oct 18, 2025", amount: "2,500 USDT", share: "1.0%", currentValue: "2,740 USDT", rewards: "240 USDT" },
  { date: "Sep 22, 2025", amount: "2,500 USDT", share: "1.0%", currentValue: "2,690 USDT", rewards: "190 USDT" },
]

export function ContributionsTable() {
  return (
    <Card className="bg-[#100F14] border-white/5">
      <CardHeader>
        <CardTitle className="text-[#E5E7EB] text-xl font-bold">Contributions History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-[#9CA3AF] font-medium pl-6">Date</TableHead>
              <TableHead className="text-[#9CA3AF] font-medium">USDT Amount</TableHead>
              <TableHead className="text-[#9CA3AF] font-medium">Share %</TableHead>
              <TableHead className="text-[#9CA3AF] font-medium">Current Value</TableHead>
              <TableHead className="text-[#9CA3AF] font-medium text-right pr-6">Rewards</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contributions.map((row, i) => (
              <TableRow key={i} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                <TableCell className="text-[#E5E7EB] py-4 pl-6">{row.date}</TableCell>
                <TableCell className="text-[#E5E7EB] font-medium">{row.amount}</TableCell>
                <TableCell className="text-[#9CA3AF]">{row.share}</TableCell>
                <TableCell className="text-[#E5E7EB]">{row.currentValue}</TableCell>
                <TableCell className="text-primary font-bold text-right pr-6">{row.rewards}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
