"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from "@/components/chart"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getDeviceById, getDatapointsByDeviceId, startSession } from "@/lib/api"

type Device = {
  id: string
  hashedMACAddress: string
  owner: string
  datapoints: Array<{
    value: number
    createdAt: string
  }>
}

type MoistureData = {
  timestamp: string
  value: number
}

export default function DeviceDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const deviceId = parseInt(params.id as string, 10)

  const [device, setDevice] = useState<Device | null>(null)
  const [moistureHistory, setMoistureHistory] = useState<MoistureData[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [showPercentage, setShowPercentage] = useState(true)

  const fetchDeviceData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      // Get device details
      const deviceData = await getDeviceById(deviceId)
      setDevice(deviceData)

      // Get datapoints for the device
      const datapoints = await getDatapointsByDeviceId(deviceId)
      
      // Transform datapoints into moisture history format
      const history = datapoints.map((dp: { value: number; createdAt: string }) => ({
        timestamp: dp.createdAt,
        value: dp.value
      }))
      
      setMoistureHistory(history)
    } catch (err) {
      setError("Failed to load device data")
      console.error("Error loading device data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeviceData()
  }, [deviceId, router])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      // Start a new session to get fresh data
      await startSession(deviceId, token)
      
      // Fetch updated data
      await fetchDeviceData()
    } catch (err) {
      console.error("Error refreshing data:", err)
    } finally {
      setLoading(false)
    }
  }

  const calculateDryingTime = (moistureLevel: number) => {
    if (moistureLevel < 20) return "Less than 1 hour"
    if (moistureLevel < 40) return "1-2 hours"
    if (moistureLevel < 60) return "2-4 hours"
    if (moistureLevel < 80) return "4-8 hours"
    return "More than 8 hours"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getMoistureColor = (level: number) => {
    if (level < 25) return "text-blue-500"
    if (level < 50) return "text-green-500"
    if (level < 75) return "text-yellow-500"
    return "text-red-500"
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (error || !device) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Device not found"}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/dashboard/devices")}>
          Back to Devices
        </Button>
      </div>
    )
  }

  // Get the latest moisture value from datapoints
  const currentMoistureLevel = device.datapoints[device.datapoints.length - 1]?.value || 0
  const lastUpdated = device.datapoints[device.datapoints.length - 1]?.createdAt || new Date().toISOString()

  return (
    <div className="relative">
      <div className="absolute left-4 top-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push("/dashboard/devices")}
          className="text-base"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
      </div>

      <div className="container mx-auto max-w-4xl lg:max-w-2xl p-4 md:p-6 mt-5">
        <div className="mb-6 space-y-2 flex justify-center">
          <div className="bg-[#5DA9E9] text-white px-3 py-1 rounded-md font-medium hover:bg-[#4A98D8]">
            {device.hashedMACAddress}
          </div>
        </div>

        <div className="relative p-4 sm:p-5 md:p-6 lg:p-8">
          <div className="flex justify-between items-center mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg border h-[350px] overflow-hidden mb-4">
            {showPercentage ? (
              <div className="p-4 md:p-6 text-center h-full flex flex-col justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="mb-4 text-9xl font-bold cursor-help">
                        <span className={getMoistureColor(currentMoistureLevel)}>{currentMoistureLevel}%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white text-black border shadow-sm">
                      <p>Current Moisture Level</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="mt-8">
                  <h3 className="mb-2 text-sm text-muted-foreground">Estimated Drying Time</h3>
                  <p className="text-2xl font-bold">{calculateDryingTime(currentMoistureLevel)}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 md:p-6 h-full">
                <h3 className="mb-4 text-sm text-muted-foreground">Moisture Level History</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={moistureHistory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={formatDate} minTickGap={60} />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value) => [`${value}%`, "Moisture"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#007BFF"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPercentage(!showPercentage)}
            >
              {showPercentage ? "Switch to Graph View" : "Switch to Percentage View"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

