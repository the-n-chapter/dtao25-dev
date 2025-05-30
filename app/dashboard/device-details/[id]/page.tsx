"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from "@/components/chart"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getDeviceById, getCurrentSessionDatapoints } from "@/lib/front_end_api_service"

type Device = {
  id: string
  hashedMACAddress: string
  owner: string
  datapoints: Array<{
    value: number
    createdAt: string
  }>
}

type SessionData = {
  averageSlope: number
  datapoints: Array<{
    value: number
    createdAt: string
  }>
}

export default function DeviceDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const deviceId = parseInt(params.id as string, 10)

  const [device, setDevice] = useState<Device | null>(null)
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [showPercentage, setShowPercentage] = useState(true)
  const MIN_MOISTURE_THRESHOLD = 100 // Minimum threshold to prevent false 100% readings

  const fetchDeviceData = async () => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        router.push("/login")
        return
      }

      // Get device details
      const deviceData = await getDeviceById(deviceId)
      setDevice(deviceData)

      // Get current session data
      const sessionData = await getCurrentSessionDatapoints(deviceId, token)
      setCurrentSession(sessionData)

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
      const token = localStorage.getItem("authToken")
      if (!token) {
        router.push("/login")
        return
      }

      // Fetch updated data
      await fetchDeviceData()
    } catch (err) {
      console.error("Error refreshing data:", err)
    } finally {
      setLoading(false)
    }
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

  const convertToPercentage = (value: number) => {
    const actualMax = currentSession?.datapoints?.length
      ? Math.max(...currentSession.datapoints.map(dp => dp.value))
      : 3300;
  
    if (actualMax < 100) {
      return Math.round((value / 100) * 10);
    }
  
    const effectiveMax = Math.max(actualMax, MIN_MOISTURE_THRESHOLD);
    return Math.min(100, Math.round((value / effectiveMax) * 100));
  };

  // Regression-based drying time estimate (to 0% moisture)
  const getEstimatedDryingTime = () => {
    if (!currentSession || !currentSession.datapoints || currentSession.datapoints.length < 2) {
      return 'Not enough data';
    }
  
    // Use the latest raw sensor value directly
    const latestRawValue = currentSession.datapoints[currentSession.datapoints.length - 1].value;
  
    const slope = currentSession.averageSlope; // raw units per ms
    if (!slope || slope >= 0) return 'Estimating...';
  
    // Estimate time in ms using raw value
    const ms = latestRawValue / Math.abs(slope);
  
    if (!isFinite(ms) || ms < 0) return 'Estimating...';
  
    const minutes = Math.round(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
  
    if (hours < 1 && mins < 1) return 'Less than 1 min';
    if (hours < 1) return `${mins} min${mins === 1 ? '' : 's'}`;
    if (hours < 24) return `${hours}h ${mins}m`;
    return 'More than 1 day';
  };  

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

  // Get the latest moisture value from current session
  const currentMoistureLevel = currentSession?.datapoints[currentSession.datapoints.length - 1]?.value || 0
  const currentMoisturePercentage = convertToPercentage(currentMoistureLevel)
  const lastUpdated = currentSession?.datapoints[currentSession.datapoints.length - 1]?.createdAt || new Date().toISOString()

  // Transform session datapoints into moisture history format with percentages
  const history = currentSession?.datapoints.map((dp: { value: number; createdAt: string }) => ({
    timestamp: dp.createdAt,
    value: convertToPercentage(dp.value)
  })) || []

  return (
    <div className="relative">
      <div className="relative mb-5 mt-5 ml-5 md:mb-5 lg:absolute lg:mb-0 lg:mt-0 lg:top-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push("/dashboard/devices")}
          className="text-base"
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </Button>
      </div>

      <div className="container mx-auto max-w-4xl lg:max-w-2xl p-4 md:p-6 mt-5">
        <div className="mb-3 space-y-2 flex justify-center mt-3">
          <div className="bg-[#5DA9E9] text-white px-3 py-1 rounded-md font-medium hover:bg-[#4A98D8]">
            Device {device.id}
          </div>
        </div>

        <div className="relative p-4 sm:p-5 md:p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-y-2 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="text-[#5DA9E9] hover:text-[#4A98D8]"
            >
              <RefreshCw className="text-[#5DA9E9]" />
              Refresh
            </Button>
            <div className="text-sm text-muted-foreground mt-1 sm:mt-0 ml-auto">
              Updated: {new Date(lastUpdated).toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card h-[350px] overflow-hidden mb-4">
            {showPercentage ? (
              <div className="p-4 md:p-6 text-center h-full flex flex-col justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="mb-4 text-8xl font-bold cursor-help">
                        <span className={getMoistureColor(currentMoisturePercentage)}>{currentMoisturePercentage}%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground border-border">
                      <p>Current Moisture Level</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="mt-8">
                  <h3 className="mb-2 text-sm text-muted-foreground">Estimated Drying Time</h3>
                  <p className="text-2xl font-bold text-foreground">{getEstimatedDryingTime()}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 md:p-6 h-full">
                <h3 className="mb-4 text-sm text-muted-foreground">Moisture Level History</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={formatDate} 
                        minTickGap={60}
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <RechartsTooltip
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                        formatter={(value) => [`${value}%`, "Moisture"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          color: "hsl(var(--popover-foreground))",
                          borderRadius: "0.5rem",
                          padding: "0.5rem"
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "hsl(var(--primary))" }}
                        activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
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
