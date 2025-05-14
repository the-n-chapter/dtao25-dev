"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { notificationService } from "@/lib/services/notification-service"

export function NotificationDialog() {
  const router = useRouter()
  const [activeNotification, setActiveNotification] = useState(notificationService.getActiveNotification())

  // Poll for changes to the active notification
  useEffect(() => {
    const interval = setInterval(() => {
      const currentActiveNotification = notificationService.getActiveNotification()
      setActiveNotification(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(currentActiveNotification)) {
          return currentActiveNotification
        }
        return prev
      })
    }, 500)
    return () => clearInterval(interval)
  }, [])
  
  const handleClose = () => {
    // Mark as unread since user just closed it manually
    notificationService.dismissActiveNotification(false)
  }

  const handleViewMore = () => {
    if (!activeNotification) return
    
    const { notification } = activeNotification
    const deviceId = notification.deviceId
    
    // Mark as read since user is navigating to view details
    notificationService.dismissActiveNotification(true)
    
    // Navigate to appropriate page based on notification type
    if (notification.type === 'moisture') {
      router.push(`/dashboard/device-details/${deviceId}`)
    } else {
      router.push('/dashboard/devices')
    }
  }

  if (!activeNotification?.show) {
    return null
  }

  return (
    <Dialog open={true} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            {activeNotification.notification.type === 'moisture' ? 'Moisture Alert' : 'Battery Alert'}
          </DialogTitle>
        </DialogHeader>
        
        <DialogDescription className="text-base">
        <span className="font-bold">Device {activeNotification.notification.deviceId}</span>: {activeNotification.notification.description}
        </DialogDescription>
        
        <DialogFooter className="flex justify-end">
          <Button onClick={handleViewMore}>
            View more
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}