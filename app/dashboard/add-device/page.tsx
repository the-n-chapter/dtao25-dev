"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, Wifi } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

// Mock data for testing
const MOCK_ESP_NETWORKS = [
  { ssid: "SmartPin-001", strength: 90 },
  { ssid: "SmartPin-002", strength: 85 },
  { ssid: "SmartPin-003", strength: 75 },
]

export default function AddDevicePage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showWifiDialog, setShowWifiDialog] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState("")
  const [wifiPasswords, setWifiPasswords] = useState<Record<string, string>>({})
  const [mockNetworks] = useState(MOCK_ESP_NETWORKS)

  const handleWifiSetup = async () => {
    if (!selectedNetwork || !wifiPasswords[selectedNetwork]) {
      setError("Please select a network and enter its password")
      return
    }

    setIsLoading(true)
    try {
      // Mock the ESP connection process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // After success, close dialog and redirect
      setShowWifiDialog(false)
      router.push("/dashboard/devices")
    } catch (err) {
      setError("An error occurred while connecting to the network")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="relative mb-5 mt-5 md:mb-5 md:mt-5 lg:absolute lg:left-4 lg:mb-0 lg:mt-0 lg:top-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="text-base"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
        </div>

        <div className="mx-auto max-w-md space-y-6 px-6 py-4 lg:max-w-sm lg:pt-16">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-center lg:text-xl">Add New Device</h1>
            <div className="space-y-4 text-justify">
              <p className="text-muted-foreground lg:text-sm">
                Follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground lg:text-sm">
                <li>Turn on the device.</li>
                <li>Connect to the device&apos;s WiFi.</li>
                <li>Click &quot;Continue to Network Selection&quot; button.</li>
                <li>The device&apos;s WiFi network selector page will appear. Don&apos;t panic.</li>
                <li>Simply select your home WiFi and enter the password.</li>
                <li>Success! The app will connect back to your home network.</li>
                <li>Done. You will be redirected to the app and can now see the device in the &quot;View my devices&quot; list.</li>
              </ol>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center">
            <Button 
              onClick={() => setShowWifiDialog(true)} 
              className="w-[280px] lg:w-[320px] bg-[#5DA9E9] hover:bg-[#4A98D8]"
              disabled={isLoading}
            >
              <Wifi className="mr-2 h-4 w-4" />
              Continue to Network Selection
            </Button>
          </div>
        </div>
      </div>

      {/* WiFi Setup Dialog */}
      <Dialog open={showWifiDialog} onOpenChange={setShowWifiDialog}>
        <DialogContent className="max-w-[360px] min-h-[360px]">
          <div className="flex flex-col items-center p-4">
            <DialogTitle className="text-2xl font-semibold">Select Network</DialogTitle>
            <DialogDescription className="pt-6 pb-5 text-center">
              Choose your home WiFi network and enter the password.
            </DialogDescription>
            <div className="w-full space-y-4">
              {mockNetworks.length > 0 ? (
                <div className="space-y-4">
                  {mockNetworks.map((network) => (
                    <div key={network.ssid} className="space-y-2">
                      <div
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${
                          selectedNetwork === network.ssid ? "border-[#5DA9E9]" : ""
                        }`}
                        onClick={() => setSelectedNetwork(network.ssid)}
                      >
                        <div className="flex items-center gap-2">
                          <Wifi className="h-4 w-4" />
                          <span>{network.ssid}</span>
                        </div>
                      </div>
                      {selectedNetwork === network.ssid && (
                        <Input
                          type="password"
                          value={wifiPasswords[network.ssid] || ""}
                          onChange={(e) => setWifiPasswords(prev => ({
                            ...prev,
                            [network.ssid]: e.target.value
                          }))}
                          placeholder="Enter WiFi password"
                          className="w-full"
                        />
                      )}
                    </div>
                  ))}
                  <Button
                    className="w-full bg-[#5DA9E9] hover:bg-[#4A98D8]"
                    onClick={handleWifiSetup}
                    disabled={!selectedNetwork || !wifiPasswords[selectedNetwork]}
                  >
                    Connect
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                  <p className="text-center text-muted-foreground">No WiFi networks available</p>
                  <Button
                    variant="outline"
                    onClick={() => setShowWifiDialog(false)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

