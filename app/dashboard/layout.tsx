import type React from "react"
import { MainNav } from "@/components/main-nav"
import { NotificationPoller } from "@/components/NotificationPoller"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <NotificationPoller />
      <MainNav />
      <main className="flex-1">{children}</main>
    </div>
  )
}

