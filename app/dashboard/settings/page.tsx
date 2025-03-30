"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { deleteUser } from '@/lib/api'
import type { ApiErrorResponse } from '@/lib/types'
import { toast } from 'sonner'
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"

interface User {
  id: number
  username: string
}

interface LocalUser extends User {
  password: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Notification settings
  const [moistureNotifications, setMoistureNotifications] = useState(true)
  const [moistureThreshold, setMoistureThreshold] = useState(20)
  const [batteryNotifications, setBatteryNotifications] = useState(true)
  const [batteryThreshold, setBatteryThreshold] = useState(15)
  const [batteryFull, setBatteryFull] = useState(true)
  const [batteryLow, setBatteryLow] = useState(true)
  const [moistureDry, setMoistureDry] = useState(true)
  const [moistureLow, setMoistureLow] = useState(true)

  // Delete account
  const [isDeleting, setIsDeleting] = useState(false)
  const [agreeToDelete, setAgreeToDelete] = useState(false)

  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login')
      return
    }

    // Get current user
    const userStr = localStorage.getItem('currentUser')
    if (!userStr) {
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(userStr) as User
      if (!user.id || !user.username) {
        throw new Error('Invalid user data')
      }
      setCurrentUser(user)
      setUsername(user.username)
      setIsAuthenticated(true)

      // Get password from local storage
      const usersStr = localStorage.getItem('users')
      if (usersStr) {
        const users = JSON.parse(usersStr) as LocalUser[]
        const userWithPassword = users.find(u => u.username === user.username)
        if (userWithPassword) {
          setPassword(userWithPassword.password)
        }
      }

      // Load notification settings
      const notificationSettings = localStorage.getItem(`${user.username}-notifications`)
      if (notificationSettings) {
        try {
          const settings = JSON.parse(notificationSettings)
          setMoistureNotifications(settings.moistureNotifications)
          setMoistureThreshold(settings.moistureThreshold)
          setBatteryNotifications(settings.batteryNotifications)
          setBatteryThreshold(settings.batteryThreshold)
          setBatteryFull(settings.batteryFull)
          setBatteryLow(settings.batteryLow)
          setMoistureDry(settings.moistureDry)
          setMoistureLow(settings.moistureLow)
        } catch (err) {
          console.error('Error parsing notification settings:', err)
        }
      }
    } catch (err) {
      console.error('Error parsing user data:', err)
      localStorage.removeItem('currentUser')
      localStorage.removeItem('authToken')
      router.push('/login')
    }
  }, [router])

  if (!isAuthenticated) {
    return null
  }

  const handleSaveNotificationSettings = async () => {
    try {
      const settings = {
        moistureNotifications,
        moistureThreshold,
        batteryNotifications,
        batteryThreshold,
        batteryFull,
        batteryLow,
        moistureDry,
        moistureLow,
      }

      localStorage.setItem(`${username}-notifications`, JSON.stringify(settings))
      setSuccess('Notification settings saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to save notification settings')
      console.error(err)
    }
  }

  const handleDeleteAccount = async () => {
    setError('')

    if (!currentUser) {
      setError('You must be logged in to delete your account')
      return
    }

    if (!agreeToDelete) {
      setError('You must agree to delete your account')
      return
    }

    try {
      setIsDeleting(true)
      const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/')
        return
      }

      // Delete from API
      try {
        await deleteUser(currentUser.id, token)
      } catch (apiError) {
        const err = apiError as { response?: { status?: number } }
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken')
          localStorage.removeItem('currentUser')
          router.push('/')
          return
        }
        throw apiError
      }

      // Update local storage
      const usersStr = localStorage.getItem('users')
      if (usersStr) {
        const users = JSON.parse(usersStr) as LocalUser[]
        const updatedUsers = users.filter((u) => u.username !== currentUser.username)
        localStorage.setItem('users', JSON.stringify(updatedUsers))
      }

      toast.success('Account deleted successfully')

      sessionStorage.setItem('intentionalLogout', 'true')
      
      localStorage.removeItem(`${currentUser.username}-notifications`)
      localStorage.removeItem('currentUser')
      localStorage.removeItem('authToken')

      setTimeout(() => {
        sessionStorage.removeItem('intentionalLogout')
        router.push('/')
      }, 2000)
    } catch (error) {
      let message = 'Failed to delete account. Please try again.'
      const err = error as { response?: { data?: ApiErrorResponse } }
      if (err.response?.data) {
        message = err.response.data.message || message
      }
      setError(message)
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="container mx-auto max-w-4xl flex-1 px-7 py-8 sm:px-8 sm:py-9 md:px-10 md:py-12">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and notification preferences</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500 bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-50">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="max-w-lg mx-auto">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              {/* Account Information */}
              <div className="rounded-lg border p-4 sm:p-5 md:p-6">
                <h2 className="mb-4 text-xl font-semibold">Account Information</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={username} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    
                  </div>
                </div>
              </div>

              {/* Delete Account Section */}
              <div className="rounded-lg border p-5 sm:p-6 md:p-7">
                <h2 className="mb-2 text-xl font-semibold text-destructive">Delete Account</h2>
                <p className="mb-4 text-sm text-gray-600">
                  Are you sure you want to delete your account? This action cannot be <span className="font-bold">undone</span>. All your data, including paired devices, will be permanently removed.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="agree-delete"
                      checked={agreeToDelete}
                      onChange={(e) => setAgreeToDelete(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="agree-delete" className="text-sm text-gray-700">
                      Yes, I agree.
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !agreeToDelete}
                      className="rounded-md px-8"
                    >
                      {isDeleting ? "Deleting..." : "DELETE"}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card className="p-6 space-y-6">
                {/* Battery Alerts */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Battery Alerts</h3>
                      <p className="text-sm text-muted-foreground">For device&apos;s battery status. These settings apply to all your devices.</p>
                    </div>
                    <Switch 
                      id="battery-notifications" 
                      checked={batteryNotifications}
                      onCheckedChange={setBatteryNotifications}
                    />
                  </div>
                  
                  {batteryNotifications && (
                    <div className="ml-1 space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="battery-full" 
                          checked={batteryFull}
                          onCheckedChange={(checked: boolean) => setBatteryFull(checked)}
                        />
                        <Label htmlFor="battery-full">Notify when battery is fully charged</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="battery-low"
                          checked={batteryLow}
                          onCheckedChange={(checked: boolean) => setBatteryLow(checked)}
                        />
                        <Label htmlFor="battery-low">Notify when battery drops below 20%</Label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-border" />

                {/* Moisture Alerts */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Moisture Alerts</h3>
                      <p className="text-sm text-muted-foreground">For moisture level changes. These settings apply to all your devices.</p>
                    </div>
                    <Switch 
                      id="moisture-notifications"
                      checked={moistureNotifications}
                      onCheckedChange={setMoistureNotifications}
                    />
                  </div>
                  
                  {moistureNotifications && (
                    <div className="ml-1 space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="moisture-dry"
                          checked={moistureDry}
                          onCheckedChange={(checked: boolean) => setMoistureDry(checked)}
                        />
                        <Label htmlFor="moisture-dry">Notify when item is completely dry</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="moisture-low"
                          checked={moistureLow}
                          onCheckedChange={(checked: boolean) => setMoistureLow(checked)}
                        />
                        <Label htmlFor="moisture-low">Notify when moisture drops below 20%</Label>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Button onClick={handleSaveNotificationSettings} className="mt-4">
                Save Settings
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 