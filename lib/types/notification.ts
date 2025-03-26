export type NotificationType = 'battery' | 'moisture'

export interface Notification {
  id: string
  type: NotificationType
  deviceId: string
  message: string
  description?: string
  timestamp: Date
  read: boolean
}

export interface NotificationSettings {
  moistureNotifications: boolean
  moistureLow: boolean
  moistureDry: boolean
  batteryNotifications: boolean
  batteryFull: boolean
  batteryLow: boolean
}

export interface NotificationState {
  lastNotificationTime: Record<string, number>
  batteryAlertActive: Record<string, boolean>
  moistureAlertActive: Record<string, boolean>
} 