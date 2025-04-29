"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { useEffect, useState } from "react"

export default function AddDevicePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("authToken")
    if (!token) {
      toast.error("Please log in to continue")
      router.push("/login")
    }
  }, [router])

  const handleOpenMiniApp = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("authToken")
      if (!token) {
        toast.error("Please log in to continue")
        router.push("/login")
        return
      }

      // Open the mini app in the same window with the token
      window.location.href = `http://192.168.12.34/?token=${token}`
    } catch (error) {
      console.error('Failed to open mini app:', error)
      toast.error("Failed to open the mini app. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="relative">
        <div className="absolute left-4 top-4">
          <Button
            variant="ghost"
            className="flex items-center text-base gap-1"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </Button>
        </div>
      </div>

      <div className="container max-w-xl py-8 space-y-5 mt-8">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Add New Device</h2>
          <p className="text-muted-foreground">Follow these steps to connect your device</p>
        </div>

        <Card className="p-6">
          <div className="max-w-lg">
            <ol className="space-y-4 list-decimal list-inside">
              <li>Turn on the device.</li>
              <li>Connect to the device&apos;s WiFi network with the information on the package.</li>
              <li>After succesful connection, click the &quot;Open a separate link&quot; button below.</li>
              <li>A mini app will open, showing the device&apos;s WiFi selector page.</li>
              <li>In this WiFi selector page, choose to connect to your WiFi network.</li>
              <li>Once done, you&apos;ll be redirected back to the main app, and the device will now appear under <Link href="/dashboard/devices" className="text-primary hover:text-primary/80">&quot;View my devices&quot;</Link>.</li>
            </ol>
          </div>

          <div className="mt-6 flex justify-center">
            <Button 
              className="w-48" 
              onClick={handleOpenMiniApp}
              disabled={isLoading}
            >
              {isLoading ? "Opening..." : "Open a separate link"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}

