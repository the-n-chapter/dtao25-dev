"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
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
      console.error("Failed to open mini app:", error)
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
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back
          </Button>
        </div>
      </div>

      <div className="container max-w-xl py-8 space-y-5 mt-8">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Add New Device</h2>
          <p className="text-muted-foreground">Follow the instructions closely to set up your devices</p>
        </div>

        <Card className="p-6">
          <div className="max-w-lg">
            <ol className="space-y-4 list-decimal list-inside text-sm md:text-base">
              <li>Turn on the Pintell device.</li>
              <li>Hold the &quot;Pairing&quot; button on the device for 3 seconds.</li>
              <li>
                Connect to the Pintell device&apos;s Wi-Fi.
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Go to your Wi-Fi settings.</li>
                  <li>Choose the network name and enter the password listed on the packaging.</li>
                  <li>Once successfully connected, click the button below.</li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="mt-6 flex justify-center">
            <Button 
              className="w-36" 
              onClick={handleOpenMiniApp}
              disabled={isLoading}
            >
              {isLoading ? "Opening..." : "Open a Mini App"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}

