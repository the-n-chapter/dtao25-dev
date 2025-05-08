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
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`lastDatapoint_${deviceId}`)
      if (stored) {
        try {
          setLastDatapoint(JSON.parse(stored))
        } catch (e) {
          console.error('Error parsing stored datapoint:', e)
          setLastDatapoint(null)
        }
      } else {
        setLastDatapoint(null)
      }
    }
  }, [deviceId])

  const handleGenerateDatapoint = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (typeof window === 'undefined') return;
      
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

  const handleGenerateIncreasingDatapoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Please log in first");
        return;
      }

      // Calculate next values
      let nextValue, nextBattery;
      if (!lastDatapoint) {
        nextValue = 0;
        nextBattery = 0;
      } else {
        nextValue = Math.min(3300, lastDatapoint.value + 30); // Increase by 30, max 3300
        nextBattery = Math.min(100, lastDatapoint.battery + 1); // Increase by 1, max 100
      }

      const datapoint = {
        value: nextValue,
        battery: nextBattery,
        deviceHashedMACAddress: deviceId
      };

      await createDatapoint(datapoint);

      // Update last datapoint
      const newLastDatapoint = { value: nextValue, battery: nextBattery };
      setLastDatapoint(newLastDatapoint);
      localStorage.setItem(`lastDatapoint_${deviceId}`, JSON.stringify(newLastDatapoint));

      toast.success(`Created datapoint: Value = ${nextValue}, Battery = ${nextBattery}`);
    } catch (error) {
      console.error("Failed to generate datapoint:", error);
      toast.error("Failed to generate datapoint");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Please log in first");
        return;
      }

      // Use the same format as other datapoints but with fixed value of -1
      const datapoint = {
        value: -1,
        battery: lastDatapoint?.battery ?? 100, // Use current battery or default to 100
        deviceHashedMACAddress: deviceId
      };

      await createDatapoint(datapoint);
      toast.success("Started new session with value: -1");
    } catch (error) {
      console.error("Failed to start session:", error);
      toast.error("Failed to start session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-[360px] space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Datapoint Testing</h1>
          <p className="text-muted-foreground mt-1">Generate test datapoints for a device</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <h3 className="font-medium mb-2">Test Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Enter the device ID (hashedMACAddress)</li>
              <li>Click &quot;Start Session&quot; to start a new session</li>
              <li>Each click will add a new datapoint based on the previous value, either decreasing ([3300, 0] for moisture, [100, 0] for battery) or increasing ([0, 3300] for moisture, [0, 100] for battery)</li>
            </ol>
          </div>

          {lastDatapoint && (
            <div className="rounded-md bg-blue-50 p-4 text-sm">
              <p>Last datapoint:</p>
              <p>Value: {lastDatapoint.value}</p>
              <p>Battery: {lastDatapoint.battery}</p>
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
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleStartSession}
              variant="outline"
            >
              {isLoading ? "Starting..." : "Start Session"}
            </Button>
            <div className="border-t my-2" />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Decreasing Data"}
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleGenerateIncreasingDatapoint}
              variant="secondary"
            >
              {isLoading ? "Generating..." : "Generate Increasing Data"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
} 