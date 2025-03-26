"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/mode-toggle"
import { Menu, Home, Settings, LogOut } from "lucide-react"
import { NotificationCenter } from "@/components/notification-center"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function MainNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [username, setUsername] = useState("")

  // Get username from localStorage
  const tryGetUsername = () => {
    if (typeof window === 'undefined') return ""
    
    try {
      const userStr = localStorage.getItem("currentUser")
      console.log("Retrieved from localStorage:", userStr)
      
      if (!userStr) return ""
      
      const user = JSON.parse(userStr)
      console.log("Parsed user:", user)
      
      if (user && typeof user === 'object') {
        // If user is an object directly containing username
        if (user.username) {
          console.log("Found username:", user.username)
          return user.username
        }
        // Some implementations might store it differently
        else if (user.user && user.user.username) {
          console.log("Found nested username:", user.user.username)
          return user.user.username
        }
        // Try other common variations
        else if (user.name) {
          console.log("Using name field:", user.name)
          return user.name
        }
      }
    } catch (err) {
      console.error("Error getting username:", err)
    }
    
    return ""
  }

  // Prevent hydration errors and load user data
  useEffect(() => {
    setIsClient(true)
    const currentUsername = tryGetUsername()
    if (currentUsername) {
      setUsername(currentUsername)
    }
  }, [])

  const confirmLogout = () => {
    console.log("Confirming logout, current username:", username)
    setMenuOpen(false)
    setLogoutDialogOpen(true)
  }

  const handleLogout = () => {
    console.log("Logging out, clearing localStorage")
    localStorage.removeItem("authToken")
    localStorage.removeItem("currentUser")
    setLogoutDialogOpen(false)
    setUsername("")
    router.push("/")
  }

  const handleNavigation = (path: string) => {
    setMenuOpen(false)
    router.push(path)
  }

  if (!isClient) return null

  // Check if user is authenticated
  const isAuthenticated = !!localStorage.getItem("authToken")
  const isIntentionalLogout = !!sessionStorage.getItem("intentionalLogout")

  if (!isAuthenticated && !isIntentionalLogout && pathname !== "/" && pathname !== "/login" && pathname !== "/signup") {
    router.push("/login")
    return null
  }

  // Don't show nav on auth pages
  if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return null
  }

  // If we still don't have a username, try again (for cases where the effect might not have run yet)
  const displayUsername = username || tryGetUsername()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col items-center mb-8 pt-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-4xl font-bold mb-3">
                  {displayUsername ? displayUsername.charAt(0).toUpperCase() : "U"}
                </div>
                {displayUsername ? (
                  <p className="text-lg font-medium">{displayUsername}</p>
                ) : (
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-500">User</p>
                    <p className="text-xs text-red-500 mt-1">Debug: {isClient ? "Client Ready" : "Not Client Ready"}</p>
                  </div>
                )}
              </div>
              
              <div className="h-px bg-border mb-4 mx-3"></div>
              
              <nav className="flex flex-col gap-2 px-2">
                <button
                  onClick={() => handleNavigation("/dashboard")}
                  className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Home className="h-5 w-5" />
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavigation("/dashboard/settings")}
                  className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <LogOut className="h-5 w-5" />
                  Log out
                </button>
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="font-bold text-[#5DA9E9]">
            pinova
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <NotificationCenter />
          <ModeToggle />
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Out</DialogTitle>
            <DialogDescription>Are you sure you want to log out of your account?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end items-center gap-2">
            <Button onClick={handleLogout} className="w-24">
              Log Out
            </Button>
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)} className="w-24">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}

