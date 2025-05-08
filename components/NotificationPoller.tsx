"use client"
import { useEffect } from "react";
import { getMyProfile, getCurrentSessionDatapoints, startSession } from "@/lib/front_end_api_service";
import { notificationService } from "@/lib/services/notification-service";

export function NotificationPoller() {
  useEffect(() => {
    const poll = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      try {
        const { devices: userDevices, username } = await getMyProfile(token);
        if (userDevices && username) {
          for (const device of userDevices) {
            // Handle battery updates
            notificationService.handleBatteryUpdate(username, device.id, device.battery);

            // Start a new session to get fresh moisture data
            await startSession(device.hashedMACAddress, token);
            
            // Get current session datapoints
            const sessionData = await getCurrentSessionDatapoints(device.id, token);
            const latestDatapoint = sessionData.datapoints[0]; // Get first datapoint as it's the latest
            
            if (latestDatapoint) {
              const moisturePercentage = Math.round((latestDatapoint.value / 3300) * 100);
              notificationService.handleMoistureUpdate(username, device.id, moisturePercentage);
            }
          }
        }
      } catch (error) {
        console.error("Error in notification poller:", error);
      }
    };
    poll(); // Run once on mount
    const interval = setInterval(poll, 1000 * 60); // Every minute
    return () => clearInterval(interval);
  }, []);
  return null;
} 