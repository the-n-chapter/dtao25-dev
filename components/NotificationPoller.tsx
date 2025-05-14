"use client"

import { useEffect } from "react"
import { notificationService } from "@/lib/services/notification-service"
import { getMyProfile, getCurrentSessionDatapoints } from "@/lib/front_end_api_service"
import { NotificationDialog } from "./notification-dialog"

type Datapoint = {
  value: number
  createdAt: string
}

const MIN_MOISTURE_THRESHOLD = 100 // Minimum threshold to prevent false 100% readings

export function NotificationPoller() {
  useEffect(() => {
    const poll = async () => {
      const token = localStorage.getItem("authToken")
      if (!token) return
      try {
        const { devices: userDevices, username } = await getMyProfile(token)
        if (userDevices && username) {
          for (const device of userDevices) {
            // Handle battery updates
            if (typeof device.battery === 'number') {
              notificationService.handleBatteryUpdate(username, device.id, device.battery)
            }
            // Get current session datapoints
            const sessionData = await getCurrentSessionDatapoints(device.id, token)
            const validDatapoints = sessionData.datapoints.filter((dp: Datapoint) => dp.value !== -1)
            const actualMax = validDatapoints.length
              ? Math.max(...validDatapoints.map((dp: Datapoint) => dp.value))
              : 3300;
            const latestValue = validDatapoints.length
              ? validDatapoints[validDatapoints.length - 1].value
              : 0;
            let moisturePercentage
            if (actualMax < 100) {
              moisturePercentage = Math.round((latestValue / 100) * 10)
            } else {
              const effectiveMax = Math.max(actualMax, MIN_MOISTURE_THRESHOLD)
              moisturePercentage = Math.min(100, Math.round((latestValue / effectiveMax) * 100))
            }
            notificationService.handleMoistureUpdate(username, device.id, moisturePercentage)
          }
        }
      } catch (error) {
        console.error("Error in notification poller:", error)
      }
    }
    poll()
    const interval = setInterval(poll, 1000 * 60)
    return () => clearInterval(interval)
  }, [])
  return <NotificationDialog />
}
