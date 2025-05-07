"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createDatapoint } from "@/lib/front_end_api_service"

interface LastDatapoint {
  value: number;
  battery: number;
}

export default function AddDatapointsPage() {
  const [deviceId, setDeviceId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastDatapoint, setLastDatapoint] = useState<LastDatapoint | null>(null)

  // Load last datapoint from localStorage when deviceId changes
  useEffect(() => {
    const stored = localStorage.getItem(`lastDatapoint_${deviceId}`)
    if (stored) {
      setLastDatapoint(JSON.parse(stored))
    } else {
      setLastDatapoint(null)
    }
  }, [deviceId])

  const handleGenerateDatapoint = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        toast.error("Please log in first")
        return
      }

      // Calculate next values
      let nextValue: number
      let nextBattery: number

      if (!lastDatapoint) {
        // First datapoint for this device
        nextValue = 3300
        nextBattery = 100
      } else {
        // Calculate next values with downtrend
        nextValue = Math.max(0, lastDatapoint.value - 30) // Decrease by 30, minimum 0
        nextBattery = Math.max(0, lastDatapoint.battery - 1) // Decrease by 1, minimum 0
      }

      // 20% chance to simulate communication failure
      if (Math.random() < 0.2) {
        nextBattery = -1
        console.log("Skipping datapoint due to simulated communication failure")
        toast.error("Communication failure - no datapoint created")
        return
      }

      const datapoint = {
        value: nextValue,
        battery: nextBattery,
        deviceHashedMACAddress: deviceId
      }

      await createDatapoint(datapoint)
      
      // Update last datapoint
      const newLastDatapoint = { value: nextValue, battery: nextBattery }
      setLastDatapoint(newLastDatapoint)
      localStorage.setItem(`lastDatapoint_${deviceId}`, JSON.stringify(newLastDatapoint))

      toast.success(`Created datapoint: Value = ${nextValue}, Battery = ${nextBattery}%`)
    } catch (error) {
      console.error("Failed to generate datapoint:", error)
      toast.error("Failed to generate datapoint")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-[360px] space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Datapoint Testing</h1>
          <p className="text-muted-foreground mt-2">Generate test datapoints for a device</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <h3 className="font-medium mb-2">Test Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Make sure you are logged in first</li>
              <li>Enter the device ID (hashedMACAddress)</li>
              <li>Click &quot;Generate Datapoint&quot; to create one test datapoint</li>
              <li>Each click will create a new datapoint with decreasing values</li>
              <li>Values range from 3300 to 0, battery from 100% to 0%</li>
            </ol>
          </div>

          {lastDatapoint && (
            <div className="rounded-md bg-blue-50 p-4 text-sm">
              <p>Last datapoint:</p>
              <p>Value: {lastDatapoint.value}</p>
              <p>Battery: {lastDatapoint.battery}%</p>
            </div>
          )}

          <form onSubmit={handleGenerateDatapoint} className="flex flex-col space-y-4">
            <Input
              type="text"
              placeholder="Device ID (hashedMACAddress)"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              required
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Datapoint"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
} 