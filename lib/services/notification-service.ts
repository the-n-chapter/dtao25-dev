"use client"

import { toast } from 'sonner'

interface NotificationState {
  lastNotificationTime: Record<string, number>
  batteryAlertActive: Record<string, boolean>
  moistureAlertActive: Record<string, boolean>
  previousBatteryLevel?: Record<string, number>
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

    // Get user's custom battery thresholds
    const batteryThresholds = settings.selectedBatteryTags || []
    if (batteryThresholds.length === 0) return

    // Convert threshold strings to numbers (remove % and convert to number)
    const thresholds = batteryThresholds.map((t: string) => parseInt(t.replace('%', '')))
    // Sort thresholds in descending order to handle them from highest to lowest
    thresholds.sort((a: number, b: number) => b - a)

    for (const threshold of thresholds) {
      const alertKey = `${deviceId}-${threshold}`;
      const prevKey = `${deviceId}-${threshold}-prev`;
      const prevLevel = this.notificationState.previousBatteryLevel?.[prevKey];

      // Initialize previousBatteryLevel if it doesn't exist
      if (!this.notificationState.previousBatteryLevel) {
        this.notificationState.previousBatteryLevel = {};
      }

      // Case 1: Exact threshold match - notify for any threshold
      if (batteryLevel === threshold && !this.notificationState.batteryAlertActive[alertKey]) {
        this.notificationState.batteryAlertActive[alertKey] = true;
        toast.info(`Device ${deviceId}: Battery Level Alert`, {
          description: `Battery level has reached ${batteryLevel}%.`,
          duration: Infinity,
          richColors: false,
        });
        this.updateLastNotificationTime(deviceId);
      }
      // Case 2: First time crossing below threshold (for non-zero thresholds)
      else if (
        threshold !== 0 &&
        prevLevel !== undefined &&
        prevLevel > threshold &&
        batteryLevel < threshold &&
        !this.notificationState.batteryAlertActive[alertKey]
      ) {
        this.notificationState.batteryAlertActive[alertKey] = true;
        toast.info(`Device ${deviceId}: Battery Level Alert`, {
          description: `Battery level has dropped below ${threshold}% (currently at ${batteryLevel}%).`,
          duration: Infinity,
          richColors: false,
        });
        this.updateLastNotificationTime(deviceId);
      }

      // Reset alert state when battery level increases above threshold
      if (batteryLevel > threshold) {
        this.notificationState.batteryAlertActive[alertKey] = false;
      }

      // Update previous value
      this.notificationState.previousBatteryLevel[prevKey] = batteryLevel;
    }
  }

  handleMoistureUpdate(username: string, deviceId: string, moistureLevel: number) {
    const settings = this.getUserSettings(username)
    if (!settings?.moistureNotifications) return

    // Get user's custom moisture thresholds
    const moistureThresholds = settings.selectedMoistureTags || []
    if (moistureThresholds.length === 0) return

    // Convert threshold strings to numbers (remove % and convert to number)
    const thresholds = moistureThresholds.map((t: string) => parseInt(t.replace('%', '')))

    // Check if moisture level matches any threshold
    for (const threshold of thresholds) {
      if (moistureLevel === threshold) {
        const isAlertActive = this.notificationState.moistureAlertActive[`${deviceId}-${threshold}`]
        
        if (!isAlertActive) {
          this.notificationState.moistureAlertActive[`${deviceId}-${threshold}`] = true
          toast.info(`Device ${deviceId}: Moisture Level Alert`, {
            description: `Moisture level has reached ${moistureLevel}%.`,
            duration: Infinity,
          })
          this.updateLastNotificationTime(deviceId)
        }
      } else {
        // Reset alert state when moisture level changes
        this.notificationState.moistureAlertActive[`${deviceId}-${threshold}`] = false
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