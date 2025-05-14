"use client"

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  type: 'battery' | 'moisture';
  deviceId: string;
  percentage: number;
  unread: boolean;
  dismissed: boolean; // Track whether notification was manually dismissed
}

interface ActiveNotification {
  notification: Notification;
  show: boolean;
}

interface NotificationState {
  lastNotificationTime: Record<string, number>;
  batteryAlertActive: Record<string, boolean>;
  moistureAlertActive: Record<string, boolean>;
  previousBatteryLevel?: Record<string, number>;
  previousMoistureLevel?: Record<string, number>;
  notifications: Notification[]; // Store all notifications
  activeNotification: ActiveNotification | null; // Track currently displayed notification
}

const NOTIFICATION_INTERVAL = 30 * 60 * 1000 // 30 minutes in milliseconds

class NotificationService {
  private static instance: NotificationService
  private notificationState: NotificationState = {
    lastNotificationTime: {},
    batteryAlertActive: {},
    moistureAlertActive: {},
    notifications: [],
    activeNotification: null
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      // Load notifications from localStorage on initialization
      const savedNotifications = localStorage.getItem('notifications')
      if (savedNotifications) {
        this.notificationState.notifications = JSON.parse(savedNotifications)
      }

      // Load alert states from localStorage
      const savedAlertStates = localStorage.getItem('notificationAlertStates')
      if (savedAlertStates) {
        const states = JSON.parse(savedAlertStates)
        this.notificationState.batteryAlertActive = states.batteryAlertActive || {}
        this.notificationState.moistureAlertActive = states.moistureAlertActive || {}
        this.notificationState.previousBatteryLevel = states.previousBatteryLevel || {}
        this.notificationState.previousMoistureLevel = states.previousMoistureLevel || {}
      }
    }
  }

  private saveNotifications() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications', JSON.stringify(this.notificationState.notifications))
      // Save alert states to localStorage
      localStorage.setItem('notificationAlertStates', JSON.stringify({
        batteryAlertActive: this.notificationState.batteryAlertActive,
        moistureAlertActive: this.notificationState.moistureAlertActive,
        previousBatteryLevel: this.notificationState.previousBatteryLevel,
        previousMoistureLevel: this.notificationState.previousMoistureLevel
      }))
    }
  }

  // Clean up notifications older than 72 hours (3 days)
  private cleanupOldNotifications() {
    const THREE_DAYS_MS = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
    const now = Date.now();
    
    // Remove notifications older than 72 hours (3 days)
    this.notificationState.notifications = this.notificationState.notifications.filter(
      notification => (now - notification.timestamp) < THREE_DAYS_MS
    );
    
    // Clean up alert states for devices that haven't sent updates in 72 hours
    const deviceIds = new Set(this.notificationState.notifications.map(n => n.deviceId));
    
    // Clean up battery alert states
    Object.keys(this.notificationState.batteryAlertActive).forEach(key => {
      const deviceId = key.split('-')[0];
      if (!deviceIds.has(deviceId)) {
        delete this.notificationState.batteryAlertActive[key];
      }
    });

    // Clean up moisture alert states
    Object.keys(this.notificationState.moistureAlertActive).forEach(key => {
      const deviceId = key.split('-')[0];
      if (!deviceIds.has(deviceId)) {
        delete this.notificationState.moistureAlertActive[key];
      }
    });

    // Clean up last notification times
    Object.keys(this.notificationState.lastNotificationTime).forEach(deviceId => {
      if (!deviceIds.has(deviceId)) {
        delete this.notificationState.lastNotificationTime[deviceId];
      }
    });

    // Clean up previous levels for devices that haven't sent updates
    if (this.notificationState.previousBatteryLevel) {
      Object.keys(this.notificationState.previousBatteryLevel || {}).forEach(key => {
        const deviceId = key.split('-')[0];
        if (!deviceIds.has(deviceId)) {
          delete this.notificationState.previousBatteryLevel![key];
        }
      });
    }

    if (this.notificationState.previousMoistureLevel) {
      Object.keys(this.notificationState.previousMoistureLevel || {}).forEach(key => {
        const deviceId = key.split('-')[0];
        if (!deviceIds.has(deviceId)) {
          delete this.notificationState.previousMoistureLevel![key];
        }
      });
    }

    this.saveNotifications();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private getUserSettings(username: string) {
    if (typeof window === 'undefined') return null
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

  private addNotification(title: string, description: string, type: 'battery' | 'moisture', deviceId: string, percentage: number) {
    const notification: Notification = {
      id: crypto.randomUUID(),
      title,
      description,
      timestamp: Date.now(),
      type,
      deviceId: String(deviceId),
      percentage,
      unread: true,
      dismissed: false
    };
    this.notificationState.notifications.push(notification);
    
    // Set as active notification if there's none currently active
    if (!this.notificationState.activeNotification) {
      this.setActiveNotification(notification);
    }
    
    this.saveNotifications();
    this.cleanupOldNotifications(); // Clean up old notifications after adding new ones
    
    return notification;
  }

  setActiveNotification(notification: Notification | null) {
    if (notification) {
      this.notificationState.activeNotification = {
        notification,
        show: true
      };
    } else {
      this.notificationState.activeNotification = null;
    }
  }

  getActiveNotification() {
    return this.notificationState.activeNotification;
  }

  dismissActiveNotification(wasRead: boolean = false) {
    if (this.notificationState.activeNotification) {
      const notificationId = this.notificationState.activeNotification.notification.id;
      
      // Mark as read or unread based on how it was dismissed
      if (wasRead) {
        this.markNotificationAsRead(notificationId);
      } else {
        // Find the notification and mark it as dismissed but keep unread status
        const notification = this.notificationState.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.dismissed = true;
          this.saveNotifications();
        }
      }
      
      // Clear the active notification
      this.notificationState.activeNotification = null;
      
      // Check for next unread and undismissed notification to show
      this.showNextNotification();
    }
  }

  showNextNotification() {
    // Find the next unread and undismissed notification to show
    const nextNotification = this.notificationState.notifications.find(
      n => n.unread && !n.dismissed
    );
    
    if (nextNotification) {
      this.setActiveNotification(nextNotification);
    }
  }

  getAllNotifications() {
    this.cleanupOldNotifications(); // Clean up before returning notifications
    // Return all notifications, newest first
    return [...this.notificationState.notifications].sort((a, b) => b.timestamp - a.timestamp);
  }

  getUnreadNotifications() {
    return this.notificationState.notifications.filter(n => n.unread);
  }

  markNotificationAsRead(notificationId: string) {
    const notif = this.notificationState.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.unread = false;
      notif.dismissed = true; // Also mark as dismissed
      this.saveNotifications();
    }
  }

  markAllAsRead() {
    this.notificationState.notifications.forEach(notif => {
      notif.unread = false;
      notif.dismissed = true;
    });
    
    // Clear any active notification
    this.notificationState.activeNotification = null;
    
    this.saveNotifications();
  }

  deleteAllNotifications() {
    this.notificationState.notifications = [];
    this.notificationState.activeNotification = null;
    this.saveNotifications();
  }

  handleBatteryUpdate(username: string, deviceId: string, batteryLevel: number) {
    const settings = this.getUserSettings(username)

    if (!settings?.batteryNotifications) {
      return;
    }

    // Get user's custom battery thresholds
    const batteryThresholds = settings.selectedBatteryTags || []

    if (batteryThresholds.length === 0) {
      return;
    }

    // Convert threshold strings to numbers (remove % and convert to number)
    const thresholds = batteryThresholds.map((t: string) => parseInt(t.replace('%', '')))
    // Sort thresholds in descending order to handle them from highest to lowest
    thresholds.sort((a: number, b: number) => b - a)

    for (const threshold of thresholds) {
      const alertKey = `${deviceId}-${threshold}`;
      const prevKey = `${deviceId}-${threshold}-prev`;

      // Initialize previousBatteryLevel if it doesn't exist
      if (!this.notificationState.previousBatteryLevel) {
        this.notificationState.previousBatteryLevel = {};
      }

      // Case 1: Exact threshold match for 100%
      if (threshold === 100 && batteryLevel === threshold && !this.notificationState.batteryAlertActive[alertKey]) {
        this.notificationState.batteryAlertActive[alertKey] = true;
        const title = `Device ${deviceId}: Battery Level Alert`;
        const description = `Battery level has reached ${batteryLevel}%.`;
        
        this.addNotification(title, description, 'battery', deviceId, batteryLevel);
        this.updateLastNotificationTime(deviceId);
      }
      // Case 2: Below threshold for non-100% thresholds
      else if (threshold !== 100 && batteryLevel < threshold && !this.notificationState.batteryAlertActive[alertKey]) {
        this.notificationState.batteryAlertActive[alertKey] = true;
        const title = `Device ${deviceId}: Battery Level Alert`;
        const description = `Battery level is currently at ${batteryLevel}%.`;
        
        this.addNotification(title, description, 'battery', deviceId, batteryLevel);
        this.updateLastNotificationTime(deviceId);
      }

      // Reset alert state when battery level changes from threshold
      if (threshold === 100 && batteryLevel < 100) {
        this.notificationState.batteryAlertActive[alertKey] = false;
      } else if (threshold !== 100 && batteryLevel > threshold) {
        this.notificationState.batteryAlertActive[alertKey] = false;
      }

      // Update previous value
      this.notificationState.previousBatteryLevel[prevKey] = batteryLevel;
    }
  }

  handleMoistureUpdate(username: string, deviceId: string, moisturePercentage: number) {
    const settings = this.getUserSettings(username)

    if (!settings?.moistureNotifications) {
      return;
    }

    // Get user's custom moisture thresholds (intervals)
    const moistureThresholds = settings.selectedMoistureTags || []

    if (moistureThresholds.length === 0) {
      return;
    }

    // Parse intervals like '0-2%' into [0,2]
    const intervals = moistureThresholds.map((interval: string) => {
      const match = interval.match(/(\d+)-(\d+)%/)
      if (match) {
        const min = parseInt(match[1])
        const max = parseInt(match[2])
        // Ensure min <= max
        return [Math.min(min, max), Math.max(min, max)]
      } else {
        // fallback for single value like '10%'
        const single = parseInt(interval.replace('%', ''))
        return [single, single]
      }
    })

    // For each interval, check if moisturePercentage falls within
    for (let i = 0; i < intervals.length; i++) {
      const [min, max] = intervals[i]
      const alertKey = `${deviceId}-moisture-${min}-${max}`
      const prevKey = `${deviceId}-moisture-${min}-${max}-prev`

      // Initialize previousMoistureLevel if it doesn't exist
      if (!this.notificationState.previousMoistureLevel) {
        this.notificationState.previousMoistureLevel = {};
      }

      const inInterval = moisturePercentage >= min && moisturePercentage <= max
      const wasInInterval = this.notificationState.moistureAlertActive[alertKey]

      // Case 1: First time entering the interval
      if (inInterval && !wasInInterval) {
        this.notificationState.moistureAlertActive[alertKey] = true
        const title = `Device ${deviceId}: Moisture Level Alert`;
        const description = `Moisture level is currently at ${moisturePercentage}%.`;
        
        this.addNotification(title, description, 'moisture', deviceId, moisturePercentage);
        this.updateLastNotificationTime(deviceId)
      }
      // Case 2: Exiting the interval
      else if (wasInInterval && !inInterval) {
        this.notificationState.moistureAlertActive[alertKey] = false
      }

      // Update previous value
      this.notificationState.previousMoistureLevel[prevKey] = moisturePercentage;
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
    
    // If active notification is for this device, clear it
    if (this.notificationState.activeNotification?.notification.deviceId === deviceId) {
      this.notificationState.activeNotification = null;
      this.showNextNotification();
    }
    
    this.saveNotifications(); // Save after resetting
  }
}

export const notificationService = NotificationService.getInstance()