import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A] text-white">
            <h1 className="text-6xl font-bold mb-4">404</h1>
            <p className="text-xl text-gray-400 mb-8">Page Not Found</p>
            <Link href="/">
                <Button variant="default">Return Home</Button>
            </Link>
        </div>
    )
}
