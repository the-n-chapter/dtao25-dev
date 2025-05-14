"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { notificationService } from "@/lib/services/notification-service"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  title: string
  description: string
  timestamp: number
  type: 'battery' | 'moisture'
  deviceId: string
  percentage: number
  unread: boolean
  dismissed: boolean
}

export function NotificationCenter() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    notificationService.getAllNotifications()
  )
  const [open, setOpen] = useState(false)

  // Poll for updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(notificationService.getAllNotifications())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleNotificationClick = (notification: Notification) => {
    // Navigate to appropriate page based on notification type
    if (notification.type === 'moisture') {
      router.push(`/dashboard/device-details/${notification.deviceId}`)
    } else {
      router.push('/dashboard/devices')
    }
    
    // Mark as read when clicked
    notificationService.markNotificationAsRead(notification.id)
    setNotifications(notificationService.getAllNotifications())
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h2 className="font-semibold">Notifications</h2>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              className="text-xs"
              onClick={() => {
                notificationService.deleteAllNotifications()
                setNotifications([])
              }}
            >
              Clear all
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="grid gap-1 p-1">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    notification.unread
                      ? "bg-muted/50 hover:bg-muted"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm mt-1">
                    <span className="font-bold">Device {notification.deviceId}</span>: {notification.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

