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
  previousMoistureLevel?: Record<string, number>;
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
    this.saveNotifications();
    this.cleanupOldNotifications(); // Clean up old notifications after adding new ones
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
      // Don't reset alert state when marking as read
      this.saveNotifications();
    }
  }

  markAllAsRead() {
    this.notificationState.notifications.forEach(notif => {
      notif.unread = false;
    });
    this.saveNotifications();
  }

  deleteAllNotifications() {
    this.notificationState.notifications = [];
    this.saveNotifications();
  }

  handleBatteryUpdate(username: string, deviceId: string, batteryLevel: number) {
    console.log('Battery Update Called:', {
      username,
      deviceId,
      batteryLevel,
      timestamp: new Date().toISOString()
    });

    const settings = this.getUserSettings(username)
    console.log('User Settings:', settings);

    if (!settings?.batteryNotifications) {
      console.log('Battery notifications disabled for user');
      return;
    }

    // Get user's custom battery thresholds
    const batteryThresholds = settings.selectedBatteryTags || []
    console.log('Battery Thresholds:', batteryThresholds);

    if (batteryThresholds.length === 0) {
      console.log('No battery thresholds configured');
      return;
    }

    // Convert threshold strings to numbers (remove % and convert to number)
    const thresholds = batteryThresholds.map((t: string) => parseInt(t.replace('%', '')))
    // Sort thresholds in descending order to handle them from highest to lowest
    thresholds.sort((a: number, b: number) => b - a)
    console.log('Parsed Thresholds:', thresholds);

    for (const threshold of thresholds) {
      const alertKey = `${deviceId}-${threshold}`;
      const prevKey = `${deviceId}-${threshold}-prev`;
      const prevLevel = this.notificationState.previousBatteryLevel?.[prevKey];

      console.log('Checking Threshold:', {
        threshold,
        alertKey,
        prevLevel,
        currentAlertState: this.notificationState.batteryAlertActive[alertKey]
      });

      // Initialize previousBatteryLevel if it doesn't exist
      if (!this.notificationState.previousBatteryLevel) {
        this.notificationState.previousBatteryLevel = {};
      }

      // Case 1: Exact threshold match for 100%
      if (threshold === 100 && batteryLevel === threshold && !this.notificationState.batteryAlertActive[alertKey]) {
        console.log('Triggering notification - exact threshold match');
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
      // Case 2: Below threshold for non-100% thresholds
      else if (threshold !== 100 && batteryLevel < threshold && !this.notificationState.batteryAlertActive[alertKey]) {
        console.log('Triggering notification - below threshold');
        this.notificationState.batteryAlertActive[alertKey] = true;
        const title = `Device ${deviceId}: Battery Level Alert`;
        const description = `Battery level is currently at ${batteryLevel}%.`;
        
        toast.info(title, {
          description,
          duration: NOTIFICATION_DURATION,
          richColors: false,
        });
        this.addNotification(title, description, 'battery', deviceId, threshold);
        this.updateLastNotificationTime(deviceId);
      }

      // Reset alert state when battery level changes from threshold
      if (threshold === 100 && batteryLevel < 100) {
        console.log('Resetting alert state - battery below 100%');
        this.notificationState.batteryAlertActive[alertKey] = false;
      } else if (threshold !== 100 && batteryLevel > threshold) {
        console.log('Resetting alert state - battery above threshold');
        this.notificationState.batteryAlertActive[alertKey] = false;
      }

      // Update previous value
      this.notificationState.previousBatteryLevel[prevKey] = batteryLevel;
    }
  }

  handleMoistureUpdate(username: string, deviceId: string, moistureLevel: number) {
    console.log('Moisture Update Called:', {
      username,
      deviceId,
      moistureLevel,
      timestamp: new Date().toISOString()
    });

    const settings = this.getUserSettings(username)
    console.log('User Settings:', settings);

    if (!settings?.moistureNotifications) {
      console.log('Moisture notifications disabled for user');
      return;
    }

    // Get user's custom moisture thresholds (intervals)
    const moistureThresholds = settings.selectedMoistureTags || []
    console.log('Moisture Thresholds:', moistureThresholds);

    if (moistureThresholds.length === 0) {
      console.log('No moisture thresholds configured');
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
    console.log('Parsed Intervals:', intervals);

    // For each interval, check if moistureLevel falls within
    for (let i = 0; i < intervals.length; i++) {
      const [min, max] = intervals[i]
      const alertKey = `${deviceId}-moisture-${min}-${max}`
      const prevKey = `${deviceId}-moisture-${min}-${max}-prev`
      const prevLevel = this.notificationState.previousMoistureLevel?.[prevKey]

      // Initialize previousMoistureLevel if it doesn't exist
      if (!this.notificationState.previousMoistureLevel) {
        this.notificationState.previousMoistureLevel = {};
      }

      const inInterval = moistureLevel >= min && moistureLevel <= max
      const wasInInterval = this.notificationState.moistureAlertActive[alertKey]

      console.log('Checking Interval:', {
        min,
        max,
        alertKey,
        inInterval,
        wasInInterval,
        prevLevel,
        currentAlertState: this.notificationState.moistureAlertActive[alertKey]
      });

      // Case 1: First time entering the interval
      if (inInterval && !wasInInterval) {
        console.log('Triggering moisture notification - entering interval');
        this.notificationState.moistureAlertActive[alertKey] = true
        const title = `Device ${deviceId}: Moisture Level Alert`;
        const description = `Moisture level is currently at ${moistureLevel}%.`;
        toast.info(title, {
          description,
          duration: NOTIFICATION_DURATION,
          richColors: true,
        });
        this.addNotification(title, description, 'moisture', deviceId, min);
        this.updateLastNotificationTime(deviceId)
      }
      // Case 2: Exiting the interval
      else if (wasInInterval && !inInterval) {
        console.log('Resetting moisture alert state - exiting interval');
        this.notificationState.moistureAlertActive[alertKey] = false
      }

      // Update previous value
      this.notificationState.previousMoistureLevel[prevKey] = moistureLevel;
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
    this.saveNotifications(); // Save after resetting
  }
}

export const notificationService = NotificationService.getInstance() 