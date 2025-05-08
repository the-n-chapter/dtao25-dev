"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PlusCircle, List } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Check authentication
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/login")
      return
    }

    // Get current user
    const userStr = localStorage.getItem("currentUser")
    if (!userStr) {
      router.push("/login")
    }
  }, [router])

  // Don't render anything until we're on the client side
  if (!isClient) {
    return null
  }

  return (
    <div className="p-8">
      <div className="mb-10 space-y-2 text-left">
        <h1 className="text-2xl font-bold">
          Welcome,
        </h1>
        <p className="text-muted-foreground text-sm text-justify">
          Ready to track your clothes&apos; status? Add a new device or check your existing ones!
        </p>
      </div>
      <div className="container mx-auto max-w-md">
        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={() => router.push("/dashboard/add-device")}
            className="w-48 max-w-sm h-14 flex items-center justify-center gap-2 bg-[#5DA9E9] hover:bg-[#4A98D8]"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Add New Device</span>
          </Button>

          <Button
            onClick={() => router.push("/dashboard/devices")}
            variant="outline"
            className="w-48 max-w-sm h-14 flex items-center justify-center gap-2 border-[#5DA9E9] text-[#5DA9E9] hover:bg-[#5DA9E9]/10"
          >
            <List className="h-5 w-5" />
            <span>View My Devices</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

