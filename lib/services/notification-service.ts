"use client"

import { toast } from 'sonner'

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  type: 'battery' | 'moisture';
  deviceId: string;
  threshold: number;
  unread: boolean;
}

interface NotificationState {
  lastNotificationTime: Record<string, number>;
  batteryAlertActive: Record<string, boolean>;
  moistureAlertActive: Record<string, boolean>;
  previousBatteryLevel?: Record<string, number>;
  notifications: Notification[]; // Store all notifications
}

const NOTIFICATION_INTERVAL = 30 * 60 * 1000 // 30 minutes in milliseconds
const NOTIFICATION_DURATION = 15 * 1000 // 15 seconds in milliseconds

class NotificationService {
  private static instance: NotificationService
  private notificationState: NotificationState = {
    lastNotificationTime: {},
    batteryAlertActive: {},
    moistureAlertActive: {},
    notifications: []
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

  private addNotification(title: string, description: string, type: 'battery' | 'moisture', deviceId: string, threshold: number) {
    const notification: Notification = {
      id: `${deviceId}-${threshold}-${Date.now()}`,
      title,
      description,
      timestamp: Date.now(),
      type,
      deviceId: String(deviceId),
      threshold,
      unread: true
    };
    this.notificationState.notifications.push(notification);
  }

  getAllNotifications() {
    // Return all notifications, newest first
    return [...this.notificationState.notifications].sort((a, b) => b.timestamp - a.timestamp);
  }

  getUnreadNotifications() {
    return this.notificationState.notifications.filter(n => n.unread);
  }

  markNotificationAsRead(notificationId: string) {
    const notif = this.notificationState.notifications.find(n => n.id === notificationId);
    if (notif) notif.unread = false;
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

      // Case 1: Exact threshold match for 0% and 100%
      if ((threshold === 0 || threshold === 100) && batteryLevel === threshold && !this.notificationState.batteryAlertActive[alertKey]) {
        this.notificationState.batteryAlertActive[alertKey] = true;
        const title = `Device ${deviceId}: Battery Level Alert`;
        const description = `Battery level has reached ${batteryLevel}%.`;
        
        toast.info(title, {
          description,
          duration: NOTIFICATION_DURATION,
          richColors: false,
        });
        this.addNotification(title, description, 'battery', deviceId, threshold);
        this.updateLastNotificationTime(deviceId);
      }
      // Case 2: First time crossing below threshold (for non-0% and non-100% thresholds)
      else if (
        threshold !== 0 && threshold !== 100 &&
        prevLevel !== undefined &&
        prevLevel > threshold &&
        batteryLevel < threshold &&
        !this.notificationState.batteryAlertActive[alertKey]
      ) {
        this.notificationState.batteryAlertActive[alertKey] = true;
        const title = `Device ${deviceId}: Battery Level Alert`;
        const description = `Battery level has dropped below ${threshold}% (currently at ${batteryLevel}%).`;
        
        toast.info(title, {
          description,
          duration: NOTIFICATION_DURATION,
          richColors: false,
        });
        this.addNotification(title, description, 'battery', deviceId, threshold);
        this.updateLastNotificationTime(deviceId);
      }

      // Reset alert state when battery level changes from threshold
      if (threshold === 0 && batteryLevel > 0) {
        this.notificationState.batteryAlertActive[alertKey] = false;
      } else if (threshold === 100 && batteryLevel < 100) {
        this.notificationState.batteryAlertActive[alertKey] = false;
      } else if (threshold !== 0 && threshold !== 100 && batteryLevel > threshold) {
        this.notificationState.batteryAlertActive[alertKey] = false;
      }

      // Update previous value
      this.notificationState.previousBatteryLevel[prevKey] = batteryLevel;
    }
  }

  handleMoistureUpdate(username: string, deviceId: string, moistureLevel: number) {
    const settings = this.getUserSettings(username)
    if (!settings?.moistureNotifications) return

    // Get user's custom moisture thresholds (intervals)
    const moistureThresholds = settings.selectedMoistureTags || []
    if (moistureThresholds.length === 0) return

    // Parse intervals like '0-2%' into [0,2]
    const intervals = moistureThresholds.map((interval: string) => {
      const match = interval.match(/(\d+)-(\d+)%/)
      if (match) {
        return [parseInt(match[1]), parseInt(match[2])]
      } else {
        // fallback for single value like '10%'
        const single = parseInt(interval.replace('%', ''))
        return [single, single]
      }
    })

    // For each interval, check if moistureLevel falls within
    for (let i = 0; i < intervals.length; i++) {
      const [min, max] = intervals[i]
      const alertKey = `${deviceId}-moisture-${min}-${max}`
      const inInterval = moistureLevel >= min && moistureLevel <= max
      const wasInInterval = this.notificationState.moistureAlertActive[alertKey]

      if (inInterval && !wasInInterval) {
        this.notificationState.moistureAlertActive[alertKey] = true
        const title = `Device ${deviceId}: Moisture Level Alert`;
        const description = `Moisture level is in the range ${min}-${max}% (currently at ${moistureLevel}%).`;
        toast.info(title, {
          description,
          duration: NOTIFICATION_DURATION,
          richColors: false,
        });
        this.addNotification(title, description, 'moisture', deviceId, min);
        this.updateLastNotificationTime(deviceId)
      } else if (wasInInterval && moistureLevel > max) {
        // Reset alert only when rising above the upper margin
        this.notificationState.moistureAlertActive[alertKey] = false
      }
    }
  }

  // Reset notification state for a device
  resetDevice(deviceId: string) {
    delete this.notificationState.lastNotificationTime[deviceId]
    delete this.notificationState.batteryAlertActive[deviceId]
    delete this.notificationState.moistureAlertActive[deviceId]
    // Remove all notifications for this device
    this.notificationState.notifications = this.notificationState.notifications.filter(
      notification => notification.deviceId !== deviceId
    );
  }
}

export const notificationService = NotificationService.getInstance() 