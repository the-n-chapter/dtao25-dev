"use client"

import { toast } from 'sonner'

interface NotificationState {
  lastNotificationTime: Record<string, number>
  batteryAlertActive: Record<string, boolean>
  moistureAlertActive: Record<string, boolean>
}

const NOTIFICATION_INTERVAL = 30 * 60 * 1000 // 30 minutes in milliseconds

class NotificationService {
  private static instance: NotificationService
  private notificationState: NotificationState = {
    lastNotificationTime: {},
    batteryAlertActive: {},
    moistureAlertActive: {},
  }

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private getUserSettings(username: string) {
    const settingsStr = localStorage.getItem(`${username}-notifications`)
    if (!settingsStr) return null
    return JSON.parse(settingsStr)
  }

  private canSendNotification(deviceId: string): boolean {
    const lastTime = this.notificationState.lastNotificationTime[deviceId]
    if (!lastTime) return true
    return Date.now() - lastTime >= NOTIFICATION_INTERVAL
  }

  private updateLastNotificationTime(deviceId: string) {
    this.notificationState.lastNotificationTime[deviceId] = Date.now()
  }

  handleBatteryUpdate(username: string, deviceId: string, batteryLevel: number) {
    const settings = this.getUserSettings(username)
    if (!settings?.batteryNotifications) return

    // Handle 100% battery notification (one-time)
    if (batteryLevel === 100 && settings.batteryFull) {
      toast.success(`Device ${deviceId}: Battery fully charged`, {
        description: "Your device's battery is now fully charged.",
      })
      return
    }

    // Handle low battery notifications (periodic)
    if (batteryLevel < 20 && batteryLevel > 0 && settings.batteryLow) {
      const isAlertActive = this.notificationState.batteryAlertActive[deviceId]
      
      if (!isAlertActive) {
        // First alert when battery drops below 20%
        this.notificationState.batteryAlertActive[deviceId] = true
        toast.warning(`Device ${deviceId}: Low Battery Alert`, {
          description: `Battery level is at ${batteryLevel}%. Please charge your device soon.`,
        })
        this.updateLastNotificationTime(deviceId)
      } else if (this.canSendNotification(deviceId)) {
        // Periodic reminder
        toast.warning(`Device ${deviceId}: Low Battery Reminder`, {
          description: `Battery level is still at ${batteryLevel}%. Please charge your device.`,
        })
        this.updateLastNotificationTime(deviceId)
      }
    } else if (batteryLevel >= 20 || batteryLevel <= 0) {
      // Reset alert state when battery level goes above 20% or reaches 0%
      this.notificationState.batteryAlertActive[deviceId] = false
    }
  }

  handleMoistureUpdate(username: string, deviceId: string, moistureLevel: number) {
    const settings = this.getUserSettings(username)
    if (!settings?.moistureNotifications) return

    if (moistureLevel < 20 && moistureLevel > 0 && settings.moistureLow) {
      const isAlertActive = this.notificationState.moistureAlertActive[deviceId]
      
      if (!isAlertActive) {
        // First alert when moisture drops below 20%
        this.notificationState.moistureAlertActive[deviceId] = true
        toast.warning(`Device ${deviceId}: Low Moisture Alert`, {
          description: `Moisture level is at ${moistureLevel}%. Your item is getting dry.`,
        })
        this.updateLastNotificationTime(deviceId)
      } else if (this.canSendNotification(deviceId)) {
        // Periodic reminder
        toast.warning(`Device ${deviceId}: Low Moisture Reminder`, {
          description: `Moisture level is still at ${moistureLevel}%.`,
        })
        this.updateLastNotificationTime(deviceId)
      }
    } else if (moistureLevel >= 20 || moistureLevel <= 0) {
      // Reset alert state when moisture level goes above 20% or reaches 0%
      this.notificationState.moistureAlertActive[deviceId] = false
      
      // Notify when completely dry (0%)
      if (moistureLevel === 0 && settings.moistureDry) {
        toast.info(`Device ${deviceId}: Item is Dry`, {
          description: "Your item is now completely dry.",
        })
      }
    }
  }

  // Reset notification state for a device
  resetDevice(deviceId: string) {
    delete this.notificationState.lastNotificationTime[deviceId]
    delete this.notificationState.batteryAlertActive[deviceId]
    delete this.notificationState.moistureAlertActive[deviceId]
  }
}

export const notificationService = NotificationService.getInstance() 