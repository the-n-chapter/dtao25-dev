"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createDevice, getMyProfile } from "@/lib/front_end_api_service"

interface ApiErrorResponse {
  message: string;
}

export default function DeviceTestingPage() {
  const [hashedMACAddress, setHashedMACAddress] = useState("testdevice")
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        toast.error("Please log in first")
        return
      }

      // First check if device already exists
      const { devices } = await getMyProfile(token)
      const deviceExists = devices.some(device => device.hashedMACAddress === hashedMACAddress)
      
      if (deviceExists) {
        toast.error(`A device with MAC address "${hashedMACAddress}" already exists`)
        return
      }

      // If device doesn't exist, create it
      const response = await createDevice({ hashedMACAddress }, token)
      
      // Store the new device ID in localStorage
      localStorage.setItem('newDeviceId', response.id.toString())
      toast.success(`Device created successfully with ID: ${response.id}`)
    } catch (error: unknown) {
      const err = error as { response?: { status: number; data?: ApiErrorResponse } }
      if (err.response?.status === 400 && err.response.data?.message?.includes('already exists')) {
        toast.error(`A device with MAC address "${hashedMACAddress}" already exists`)
      } else {
        toast.error("Failed to create device")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-[360px] space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Device Testing</h1>
          <p className="text-muted-foreground mt-2">Create test devices manually</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <h3 className="font-medium mb-2">Test Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Make sure you are logged in first</li>
              <li>Use the default test value: &quot;testdevice&quot;</li>
              <li>Click &quot;Create Device&quot; to send the request</li>
              <li>Check the response in the toast notification</li>
            </ol>
          </div>

          <form onSubmit={handleCreateDevice} className="flex flex-col space-y-4">
            <Input
              type="text"
              placeholder="Hashed MAC Address"
              value={hashedMACAddress}
              onChange={(e) => setHashedMACAddress(e.target.value)}
              required
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Device"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
} 