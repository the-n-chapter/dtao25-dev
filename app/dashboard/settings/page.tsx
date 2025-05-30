"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, X, ChevronDown } from 'lucide-react'
import { deleteUser } from '@/lib/front_end_api_service'
import type { ApiErrorResponse } from '@/lib/types'
import { toast } from 'sonner'
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface User {
  id: number
  username: string
}

interface TagDropdownProps {
  options: string[]
  selectedTags: string[]
  onSelect: (tag: string) => void
  onRemove: (tag: string) => void
}

const TagDropdown: React.FC<TagDropdownProps> = ({
  options,
  selectedTags,
  onSelect,
  onRemove,
}) => {
  return (
    <div className="w-full">
      <div className="w-[180px]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4" />
                <span>Select threshold</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[180px]">
            {options.map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => onSelect(option)}
                className="cursor-pointer"
              >
                {option}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {selectedTags.map((tag) => (
          <div
            key={tag}
            className="flex items-center gap-1 bg-primary/10 text-primary rounded-md px-3 py-1"
          >
            <span className="text-sm">{tag}</span>
            <button
              onClick={() => onRemove(tag)}
              className="hover:bg-primary/20 rounded-md"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [username, setUsername] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [moistureNotifications, setMoistureNotifications] = useState(false)
  const [batteryNotifications, setBatteryNotifications] = useState(false)
  const [selectedBatteryTags, setSelectedBatteryTags] = useState<string[]>([])
  const [selectedMoistureTags, setSelectedMoistureTags] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [agreeToDelete, setAgreeToDelete] = useState(false)
  const [accountDeleted, setAccountDeleted] = useState(false)

  const batteryOptions = ['2%', '20%', '100%']
  const moistureOptions = ['0-2%', '10-15%', '20-25%']

  const handleBatteryTagSelect = (tag: string) => {
    if (!selectedBatteryTags.includes(tag)) {
      setSelectedBatteryTags([...selectedBatteryTags, tag])
    }
  }

  const handleBatteryTagRemove = (tag: string) => {
    setSelectedBatteryTags(selectedBatteryTags.filter(t => t !== tag))
  }

  const handleMoistureTagSelect = (tag: string) => {
    if (!selectedMoistureTags.includes(tag)) {
      setSelectedMoistureTags([...selectedMoistureTags, tag])
    }
  }

  const handleMoistureTagRemove = (tag: string) => {
    setSelectedMoistureTags(selectedMoistureTags.filter(t => t !== tag))
  }

  const handleBatteryNotificationsToggle = (checked: boolean) => {
    setBatteryNotifications(checked);
    if (checked && selectedBatteryTags.length === 0) {
      setSelectedBatteryTags(['100%']);
    }
  };

  const handleMoistureNotificationsToggle = (checked: boolean) => {
    setMoistureNotifications(checked);
    if (checked && selectedMoistureTags.length === 0) {
      setSelectedMoistureTags(['0-2%']);
    }
  };

  useEffect(() => {
    setIsClient(true)
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

      // Load notification settings
      const notificationSettings = localStorage.getItem(`${user.username}-notifications`)
      if (notificationSettings) {
        try {
          const settings = JSON.parse(notificationSettings)
          setMoistureNotifications(settings.moistureNotifications)
          setBatteryNotifications(settings.batteryNotifications)
          setSelectedBatteryTags(settings.selectedBatteryTags || [])
          setSelectedMoistureTags(settings.selectedMoistureTags || [])
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

  if (!isClient || !isAuthenticated) {
    return null
  }

  const handleSaveNotificationSettings = async () => {
    if (batteryNotifications && selectedBatteryTags.length === 0) {
      toast.error('If you turn on battery notifications, you need to choose at least one threshold.');
      return;
    }
    if (moistureNotifications && selectedMoistureTags.length === 0) {
      toast.error('If you turn on moisture notifications, you need to choose at least one threshold.');
      return;
    }
    try {
      const settings = {
        moistureNotifications,
        batteryNotifications,
        selectedBatteryTags,
        selectedMoistureTags,
      }
      localStorage.setItem(`${username}-notifications`, JSON.stringify(settings))
      toast.success("Notification settings saved successfully.")
    } catch (error) {
      console.error(error);
      setError('Failed to save notification settings.')
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

      setAccountDeleted(true)

      sessionStorage.setItem('intentionalLogout', 'true')
      
      localStorage.removeItem(`${currentUser.username}-notifications`)
      localStorage.removeItem('currentUser')
      localStorage.removeItem('authToken')

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
                <p className="text-sm text-muted-foreground mb-4">
                  Settings apply to <span className="font-bold">all</span> devices linked to your account.
                  To enable notifications, you must select at least <span className="font-bold">one</span> threshold for each.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Battery Alerts</Label>
                      <div className="text-sm text-muted-foreground mr-6">
                        Notified once battery drops below selected levels or reaches 100%.
                      </div>
                    </div>
                    <Switch
                      checked={batteryNotifications}
                      onCheckedChange={handleBatteryNotificationsToggle}
                    />
                  </div>
                  {batteryNotifications && (
                    <div>
                      <TagDropdown
                        options={batteryOptions}
                        selectedTags={selectedBatteryTags}
                        onSelect={handleBatteryTagSelect}
                        onRemove={handleBatteryTagRemove}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Moisture Alerts</Label>
                      <div className="text-sm text-muted-foreground mr-6">
                        Notified once moisture enters selected range.
                      </div>
                    </div>
                    <Switch
                      checked={moistureNotifications}
                      onCheckedChange={handleMoistureNotificationsToggle}
                    />
                  </div>
                  {moistureNotifications && (
                    <div>
                      <TagDropdown
                        options={moistureOptions}
                        selectedTags={selectedMoistureTags}
                        onSelect={handleMoistureTagSelect}
                        onRemove={handleMoistureTagRemove}
                      />
                    </div>
                  )}
                </div>
              </Card>

              <Button 
                onClick={handleSaveNotificationSettings} 
                className="mt-4"
                disabled={
                  (batteryNotifications && selectedBatteryTags.length === 0) ||
                  (moistureNotifications && selectedMoistureTags.length === 0)
                }
              >
                Save Changes
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ---------- Success dialog ---------- */}
      <Dialog open={accountDeleted /* no onOpenChange */}>
        <DialogContent
          /* block ESC & backdrop click */
          onEscapeKeyDown={e => e.preventDefault()}
          onPointerDownOutside={e => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Account deleted successfully.</DialogTitle>
            <DialogDescription>
              We’re sorry to see you go, and we hope to welcome you back anytime.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              onClick={() => {
                setAccountDeleted(false)   // close dialog
                router.push("/")           // then leave the page
              }}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 