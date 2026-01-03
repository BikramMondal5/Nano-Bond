import ClientLayout from "../client-layout"

export default function RoutesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <ClientLayout>{children}</ClientLayout>
}
