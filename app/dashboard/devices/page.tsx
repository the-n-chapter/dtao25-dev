"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Trash, BatteryFull, BatteryMedium, BatteryLow, BatteryWarning } from "lucide-react"
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
import { getMyProfile, deleteDevice, getCurrentSessionDatapoints } from "@/lib/front_end_api_service"
import { toast } from "sonner"
import { notificationService } from "@/lib/services/notification-service"

type Device = {
  id: string
  hashedMACAddress: string
  owner: string
  battery?: number
  datapoints: Array<{
    value: number
    createdAt: string
    updatedAt: string
  }>
}

const OFFLINE_THRESHOLD = 10 * 60 * 1000 // 10 minutes in milliseconds

export default function DevicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [devices, setDevices] = useState<Device[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [deviceToRemove, setDeviceToRemove] = useState<string | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("authToken")
      if (!token) {
        router.push("/login")
        return
      }

      const { devices: userDevices, username } = await getMyProfile(token)
      
      // Fetch current session datapoints for each device
      const devicesWithDatapoints = await Promise.all(
        (userDevices || []).map(async (device) => {
          try {
            // Get current session datapoints
            const { datapoints } = await getCurrentSessionDatapoints(device.id, token)
            
            console.log('Current Session Datapoints:', {
              deviceId: device.id,
              datapointsCount: datapoints?.length,
              firstDatapoint: datapoints?.[0]
            });
            
            // Ensure we have valid datapoints
            if (!datapoints || !Array.isArray(datapoints)) {
              console.error(`Invalid current session response for device ${device.id}`);
              return {
                ...device,
                datapoints: []
              };
            }
            
            // Filter out the session delimiter (value = -1) and sort by createdAt
            const validDatapoints = datapoints
              .filter(dp => dp.value !== -1) // Exclude session delimiter
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
            return {
              ...device,
              datapoints: validDatapoints
            }
          } catch (error) {
            console.error(`Error fetching current session for device ${device.id}:`, error)
            return {
              ...device,
              datapoints: []
            }
          }
        })
      )

      setDevices(devicesWithDatapoints)

      const newDeviceId = localStorage.getItem('newDeviceId')
      if (newDeviceId) {
        toast.success(`Device ${newDeviceId} has been added to your account.`, {
          duration: Infinity,
        })
        localStorage.removeItem('newDeviceId')
      }

      if (devicesWithDatapoints && username) {
        devicesWithDatapoints.forEach(device => {
          notificationService.handleBatteryUpdate(username, device.id, device.battery)
          const latestDatapoint = device.datapoints[0]
          if (latestDatapoint) {
            const moisturePercentage = Math.round((latestDatapoint.value / 3300) * 100)
            notificationService.handleMoistureUpdate(username, device.id, moisturePercentage)
          }
        })
      }
    } catch (err) {
      console.error("Error fetching devices:", err)
      setError("Failed to load devices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
    const interval = setInterval(fetchDevices, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [router])

  useEffect(() => {
    const newDeviceId = searchParams.get('newDevice')
    if (newDeviceId) {
      toast.success(`Device ${newDeviceId} has been added to your account.`, {
        duration: 60000
      })
      router.replace('/dashboard/devices')
    }
  }, [searchParams, router])

  const confirmRemoveDevice = (deviceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeviceToRemove(deviceId)
    setShowRemoveDialog(true)
  }

  const handleRemoveDevice = async () => {
    try {
      if (!deviceToRemove) return

      const token = localStorage.getItem("authToken")
      if (!token) throw new Error("User not authenticated")

      await deleteDevice(parseInt(deviceToRemove), token)
      setDevices(devices.filter((device) => device.id !== deviceToRemove))
      setShowRemoveDialog(false)
      setDeviceToRemove(null)
      toast.success(`Device ${deviceToRemove} has been removed from your account.`)
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

  const getBatteryColor = (level: number, isOffline: boolean) => {
    if (isOffline) return "text-gray-500"
    if (typeof level !== 'number' || isNaN(level)) return "text-gray-500"
    if (level === 0 || level < 25) return "text-red-500"
    if (level >= 75) return "text-green-500"
    if (level >= 50) return "text-yellow-500"
    if (level >= 25) return "text-orange-500"
    return "text-red-500"
  }

  const getBatteryIcon = (level: number, isOffline: boolean) => {
    if (isOffline) return <BatteryWarning className="h-6 w-6" />
    const parsed = Number(level)
    if (parsed >= 75) return <BatteryFull className="h-6 w-6" />
    if (parsed >= 50) return <BatteryMedium className="h-6 w-6" />
    if (parsed >= 25) return <BatteryLow className="h-6 w-6" />
    return <BatteryWarning className="h-6 w-6" />
  }

  const formatBatteryLevel = (level: number, isOffline: boolean) => {
    if (isOffline) return "— %"
    if (typeof level !== 'number' || isNaN(level)) return "— %"
    return `${level}%`
  }

  const isDeviceOffline = (device: Device) => {
    if (!device.datapoints || device.datapoints.length === 0) {
      console.log('Device Status Debug - No datapoints:', {
        deviceId: device.id,
        hasDatapoints: !!device.datapoints,
        datapointsLength: device.datapoints?.length
      });
      return true;
    }
    
    const lastDataTime = new Date(device.datapoints[0].createdAt).getTime();
    const currentTime = Date.now();
    const timeSinceLastData = currentTime - lastDataTime;
    
    console.log('Device Status Debug:', {
      deviceId: device.id,
      lastDataTime: new Date(lastDataTime).toISOString(),
      currentTime: new Date(currentTime).toISOString(),
      timeSinceLastData,
      timeSinceLastDataInMinutes: Math.round(timeSinceLastData / (60 * 1000)),
      threshold: OFFLINE_THRESHOLD,
      thresholdInMinutes: Math.round(OFFLINE_THRESHOLD / (60 * 1000)),
      isOffline: timeSinceLastData > OFFLINE_THRESHOLD,
      datapointsCount: device.datapoints.length,
      firstDatapoint: device.datapoints[0]
    });
    
    return timeSinceLastData > OFFLINE_THRESHOLD;
  }

  const getDeviceStatus = (device: Device) => {
    const isOffline = isDeviceOffline(device);
    // Only use battery level if it's a valid number
    const batteryLevel = typeof device.battery === 'number' && device.battery >= 0 ? device.battery : undefined;
    return { isOffline, batteryLevel };
  }

  return (
    <div className="relative">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-3xl">
        <div className="relative mb-5 mt-5 md:mb-5 md:mt-5 lg:absolute lg:left-5 lg:mb-0 lg:mt-2 lg:top-3">
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
            <p className="text-muted-foreground">Manage your Pintell devices</p>
          </div>

          <div className="w-full lg:mx-auto lg:max-w-[66%] mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchDevices}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
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
            <div className="w-full lg:mx-auto lg:max-w-[66%]">
              <div className="rounded-lg border border-dashed p-8 text-center">
                <h3 className="mb-2 text-lg font-medium">No devices found</h3>
                <Button onClick={() => router.push("/dashboard/add-device")} className="bg-[#5DA9E9] hover:bg-[#4A98D8]">
                  Add Your First Device
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {devices.map((device) => {
                const batteryLevel = typeof device.battery === 'number' ? device.battery : NaN
                const deviceStatus = getDeviceStatus(device)
                const isOffline = deviceStatus.isOffline

                return (
                  <TooltipProvider delayDuration={100} key={device.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex flex-row items-center justify-between gap-4 rounded-lg border p-5 pr-2 transition-all duration-200 ${
                            isOffline 
                              ? "bg-gray-100 cursor-not-allowed opacity-70" 
                              : "hover:shadow-md hover:border-[#5DA9E9] cursor-pointer"
                          } w-full lg:mx-auto lg:max-w-[66%]`}
                          onClick={() => !isOffline && navigateToDeviceDetails(device.id)}
                        >
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className={`${
                              isOffline ? "bg-gray-400" : "bg-[#5DA9E9] hover:bg-[#4A98D8]"
                            } text-white px-3 py-1 rounded-md font-medium`}>
                              Device {device.id}
                            </div>
                            <div className="flex items-center">
                              <span className={`text-base font-medium ${getBatteryColor(batteryLevel, isOffline)} flex items-center gap-1`}>
                                {getBatteryIcon(batteryLevel, isOffline)} {formatBatteryLevel(batteryLevel, isOffline)}
                              </span>
                            </div>
                          </div>
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
                      </TooltipTrigger>
                      <TooltipContent>
                        {isOffline ? "OFFLINE" : "ONLINE | Click to view moisture data"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>
          )}

          <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove Device</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove this device? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={cancelRemoveDevice}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleRemoveDevice}>
                  Remove
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
