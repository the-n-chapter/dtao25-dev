"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getDevices } from "@/lib/front_end_api_service"

type Notification = {
  id: number
  deviceId: number
  deviceName: string
  message: string
  timestamp: string
  read: boolean
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      // Get all devices
      const devices = await getDevices()
      
      // Create notifications for each device based on latest moisture level
      const newNotifications: Notification[] = []
      
      for (const device of devices) {
        // Get latest datapoint
        const latestDatapoint = device.datapoints[device.datapoints.length - 1]
        if (!latestDatapoint) continue

        const moistureLevel = latestDatapoint.value
        const timestamp = latestDatapoint.createdAt

        // Create notification based on moisture level
        let message = ""
        if (moistureLevel < 25) {
          message = "Very low moisture detected"
        } else if (moistureLevel < 50) {
          message = "Low-medium moisture detected"
        } else if (moistureLevel < 75) {
          message = "Medium-high moisture detected"
        } else {
          message = "High moisture detected"
        }

        newNotifications.push({
          id: device.id,
          deviceId: device.id,
          deviceName: device.hashedMACAddress,
          message,
          timestamp,
          read: false
        })
      }

      // Sort notifications by timestamp, newest first
      newNotifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      setNotifications(newNotifications)
      setUnreadCount(newNotifications.filter(n => !n.read).length)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Set up polling every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = (notificationId: number) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
    setUnreadCount(0)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer ${
                  !notification.read ? "bg-muted/50" : ""
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{notification.deviceName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm">{notification.message}</p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 