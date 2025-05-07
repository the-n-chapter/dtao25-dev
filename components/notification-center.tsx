"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { notificationService } from "@/lib/services/notification-service"

export function NotificationCenter() {
  const [notifications, setNotifications] = useState(() =>
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

  const markAllAsRead = () => {
    notifications.forEach((n) => {
      if (n.unread) notificationService.markNotificationAsRead(n.id)
    })
    setNotifications(notificationService.getAllNotifications())
  }

  const dismissNotification = (id: string) => {
    notificationService.markNotificationAsRead(id)
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

  const moistureNotifications = notifications.filter(n => n.type === "moisture")
  const batteryNotifications = notifications.filter(n => n.type === "battery")
  const unreadMoistureCount = moistureNotifications.filter(n => n.unread).length
  const unreadBatteryCount = batteryNotifications.filter(n => n.unread).length
  const totalUnreadCount = unreadMoistureCount + unreadBatteryCount

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
              {totalUnreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] md:w-[380px] p-0">
        <div className="flex h-[500px] flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Notifications</h2>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-sm whitespace-nowrap">
                Mark all as read
              </Button>
            )}
          </div>

          <Tabs defaultValue="moisture" className="flex-1">
            <TabsList className="w-full grid grid-cols-2 p-1">
              <TabsTrigger value="moisture" className="relative">
                Moisture Data
                {unreadMoistureCount > 0 && (
                  <span className="z-10 absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                    {unreadMoistureCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="battery" className="relative">
                Battery Data
                {unreadBatteryCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                    {unreadBatteryCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="moisture" className="flex-1 p-0">
              <ScrollArea className="h-[400px]">
                {moistureNotifications.length === 0 ? (
                  <div className="flex items-center justify-center p-4 text-center text-muted-foreground">
                    <p>No moisture notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {moistureNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`relative flex items-start p-4 hover:bg-accent/50 ${
                          notification.unread ? "bg-accent/30" : "bg-background"
                        }`}
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 mr-4">
                          <span className="text-sm font-medium">{notification.deviceId.slice(0, 2)}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className="text-sm font-medium flex-shrink-0">Device {notification.deviceId}</p>
                            <div className="flex-grow"></div>
                            <span className="text-xs text-muted-foreground flex-shrink-0 pr-2">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                        </div>

                        {notification.unread && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => dismissNotification(notification.id)}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="battery" className="flex-1 p-0">
              <ScrollArea className="h-[400px]">
                {batteryNotifications.length === 0 ? (
                  <div className="flex items-center justify-center p-4 text-center text-muted-foreground">
                    <p>No battery notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {batteryNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`relative flex items-start p-4 hover:bg-accent/50 ${
                          notification.unread ? "bg-accent/30" : "bg-background"
                        }`}
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 mr-4">
                          <span className="text-sm font-medium">{notification.deviceId.slice(0, 2)}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className="text-sm font-medium flex-shrink-0">Device {notification.deviceId}</p>
                            <div className="flex-grow"></div>
                            <span className="text-xs text-muted-foreground flex-shrink-0 pr-2">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                        </div>

                        {notification.unread && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => dismissNotification(notification.id)}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

