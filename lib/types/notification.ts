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
  selectedMoistureTags: string[]
  batteryNotifications: boolean
  selectedBatteryTags: string[]
}

export interface NotificationState {
  lastNotificationTime: Record<string, number>
  batteryAlertActive: Record<string, boolean>
  moistureAlertActive: Record<string, boolean>
} 