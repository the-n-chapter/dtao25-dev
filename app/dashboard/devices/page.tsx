"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Trash } from "lucide-react"
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
import { getDevices, deleteDevice } from "@/lib/api"
import { toast } from "react-hot-toast"

type Device = {
  id: string
  hashedMACAddress: string
  owner: string
  datapoints: Array<{
    value: number
    createdAt: string
  }>
}

export default function DevicesPage() {
  const router = useRouter()
  const [devices, setDevices] = useState<Device[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [deviceToRemove, setDeviceToRemove] = useState<string | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem("authToken")
        if (!token) {
          router.push("/login")
          return
        }

        // Fetch devices from API
        const fetchedDevices = await getDevices()
        setDevices(fetchedDevices)
      } catch (err) {
        console.error("Error fetching devices:", err)
        setError("Failed to load devices")
      } finally {
        setLoading(false)
      }
    }

    fetchDevices()
  }, [router])

  const confirmRemoveDevice = (deviceId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click from triggering
    setDeviceToRemove(deviceId)
    setShowRemoveDialog(true)
  }

  const handleRemoveDevice = async () => {
    try {
      if (!deviceToRemove) return

      const token = localStorage.getItem("authToken")
      if (!token) {
        throw new Error("User not authenticated")
      }

      // Delete device using API
      await deleteDevice(parseInt(deviceToRemove), token)
      
      // Update local state
      setDevices(devices.filter((device) => device.id !== deviceToRemove))
      setShowRemoveDialog(false)
      setDeviceToRemove(null)
      
      // Show success message
      toast.success("Device removed successfully")
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

  // Get the latest datapoint for a device
  const getLatestDatapoint = (device: Device) => {
    if (!device.datapoints || device.datapoints.length === 0) {
      return { value: 0, createdAt: new Date().toISOString() }
    }
    return device.datapoints[device.datapoints.length - 1]
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
            <ChevronLeft className="h-5 w-5" />
            Back
          </Button>
        </div>

        <div className="space-y-6 px-2 py-4 lg:pl-0 lg:pt-16">
          <div className="mb-6 space-y-2 text-center">
            <h1 className="text-2xl font-bold">My Devices</h1>
            <p className="text-muted-foreground">Manage your connected Pintell devices</p>
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
              {devices.map((device) => {
                const latestDatapoint = getLatestDatapoint(device)
                const moistureLevel = latestDatapoint.value
                const lastUpdated = latestDatapoint.createdAt
                
                return (
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
                              {device.hashedMACAddress}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-white text-black border shadow-sm">
                            <p>Click to view moisture data</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* Moisture Level */}
                      <div className="flex items-center">
                        <span className="text-sm font-medium">{moistureLevel}%</span>
                      </div>
                      
                      {/* Last Updated */}
                      <div className="text-sm text-muted-foreground">
                        Updated: {new Date(lastUpdated).toLocaleString()}
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
                )
              })}
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

