"use client"

import { notificationService } from '@/lib/services/notification-service'
import { useNotificationStore } from '@/lib/stores/notification-store'

export function useDeviceNotifications(username: string) {
  const addNotification = useNotificationStore((state) => state.addNotification)

  const handleBatteryUpdate = (deviceId: string, batteryLevel: number) => {
    notificationService.handleBatteryUpdate(username, deviceId, batteryLevel)
    
    // Add to notification center if needed
    const settings = JSON.parse(localStorage.getItem(`${username}-notifications`) || '{}')
    if (!settings.batteryNotifications) return

    if (batteryLevel === 100 && settings.batteryFull) {
      addNotification({
        type: 'battery',
        deviceId,
        message: 'Battery fully charged',
        description: "Your device's battery is now fully charged.",
      })
    } else if (batteryLevel < 20 && batteryLevel > 0 && settings.batteryLow) {
      addNotification({
        type: 'battery',
        deviceId,
        message: 'Low Battery Alert',
        description: `Battery level is at ${batteryLevel}%. Please charge your device soon.`,
      })
    }
  }

  const handleMoistureUpdate = (deviceId: string, moistureLevel: number) => {
    notificationService.handleMoistureUpdate(username, deviceId, moistureLevel)
    
    // Add to notification center if needed
    const settings = JSON.parse(localStorage.getItem(`${username}-notifications`) || '{}')
    if (!settings.moistureNotifications) return

    if (moistureLevel === 0 && settings.moistureDry) {
      addNotification({
        type: 'moisture',
        deviceId,
        message: 'Item is Dry',
        description: 'Your item is now completely dry.',
      })
    } else if (moistureLevel < 20 && moistureLevel > 0 && settings.moistureLow) {
      addNotification({
        type: 'moisture',
        deviceId,
        message: 'Low Moisture Alert',
        description: `Moisture level is at ${moistureLevel}%. Your item is getting dry.`,
      })
    }
  }

  return {
    handleBatteryUpdate,
    handleMoistureUpdate,
  }
} 