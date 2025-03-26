"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Battery, Trash } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Device = {
  id: string
  status: "online" | "offline"
  battery: number
  moistureLevel: number
  lastUpdated: string
}

export default function DevicesPage() {
  const router = useRouter()
  const [devices, setDevices] = useState<Device[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [deviceToRemove, setDeviceToRemove] = useState<string | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)

  useEffect(() => {
    // Get current user
    const currentUser = localStorage.getItem("currentUser")
    if (!currentUser) {
      router.push("/login")
      return
    }

    // Load devices
    const userDevicesKey = `${currentUser}-devices`
    const storedDevices = localStorage.getItem(userDevicesKey)

    if (storedDevices) {
      setDevices(JSON.parse(storedDevices))
    } else {
      // Create mock devices if none exist
      const mockDevices: Device[] = [
        {
          id: "SP-001",
          status: "online",
          battery: 85,
          moistureLevel: 42,
          lastUpdated: new Date().toISOString(),
        },
        {
          id: "SP-002",
          status: "offline",
          battery: 12,
          moistureLevel: 78,
          lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
      ]
      setDevices(mockDevices)
      localStorage.setItem(userDevicesKey, JSON.stringify(mockDevices))
    }

    setLoading(false)
  }, [router])

  const confirmRemoveDevice = (deviceId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click from triggering
    setDeviceToRemove(deviceId)
    setShowRemoveDialog(true)
  }

  const handleRemoveDevice = () => {
    try {
      if (!deviceToRemove) return

      const currentUser = localStorage.getItem("currentUser")
      if (!currentUser) {
        throw new Error("User not authenticated")
      }

      const userDevicesKey = `${currentUser}-devices`
      const updatedDevices = devices.filter((device) => device.id !== deviceToRemove)

      setDevices(updatedDevices)
      localStorage.setItem(userDevicesKey, JSON.stringify(updatedDevices))
      setShowRemoveDialog(false)
      setDeviceToRemove(null)
    } catch (err) {
      setError("Failed to remove device")
      console.error(err)
    }
  }

  const cancelRemoveDevice = () => {
    setShowRemoveDialog(false)
    setDeviceToRemove(null)
  }

  const navigateToDeviceDetails = (deviceId: string) => {
    router.push(`/dashboard/device-details/${deviceId}`)
  }

  const getBatteryColor = (level: number) => {
    if (level > 50) return "text-green-500"
    if (level > 20) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <div className="relative">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-3xl">
        <div className="relative mb-5 mt-5 md:mb-5 md:mt-5 lg:absolute lg:left-8 lg:mb-0 lg:mt-0 lg:top-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/dashboard")}
            className="text-base"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
        </div>

        <div className="space-y-6 px-2 py-4 lg:pl-0 lg:pt-16">
          <div className="mb-6 space-y-2 text-center">
            <h1 className="text-2xl font-bold">My Devices</h1>
            <p className="text-muted-foreground">Manage your connected SmartPin devices</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5DA9E9] border-t-transparent"></div>
            </div>
          ) : devices.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="mb-2 text-lg font-medium">No devices found</h3>
              <Button onClick={() => router.push("/dashboard/add-device")} className="bg-[#5DA9E9] hover:bg-[#4A98D8]">
                Add Your First Device
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Device rows */}
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex flex-row items-center justify-between gap-4 rounded-lg border p-5 pr-2 transition-all duration-200 hover:shadow-md hover:border-[#5DA9E9] w-full lg:mx-auto lg:max-w-[66%]"
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Device ID */}
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="bg-[#5DA9E9] text-white px-3 py-1 rounded-md font-medium cursor-pointer hover:bg-[#4A98D8]"
                            onClick={() => navigateToDeviceDetails(device.id)}
                          >
                            {device.id}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white text-black border shadow-sm">
                          <p>Click to view moisture data</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {/* Status */}
                    <div className="flex items-center">
                      <div
                        className={`h-3 w-3 rounded-full mr-2 ${device.status === "online" ? "bg-green-500" : "bg-gray-400"}`}
                      />
                      <span className="text-sm">{device.status === "online" ? "Online" : "Offline"}</span>
                    </div>
                    
                    {/* Battery */}
                    <div className="flex items-center">
                      <Battery className={`h-5 w-5 mr-1 ${getBatteryColor(device.battery)}`} />
                      <span className="text-sm font-medium">{device.battery}%</span>
                    </div>
                  </div>
                  
                  {/* Remove Action */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive/80 shrink-0"
                    onClick={(e) => confirmRemoveDevice(device.id, e)}
                  >
                    <Trash className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">Remove</span>
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Remove Device Confirmation Dialog */}
          <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Device</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove this device?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col sm:flex-row sm:justify-end items-center gap-2">
                <Button 
                  variant="destructive" 
                  onClick={handleRemoveDevice}
                  className="w-24"
                >
                  Remove
                </Button>
                <Button 
                  variant="outline" 
                  onClick={cancelRemoveDevice}
                  className="w-24"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

