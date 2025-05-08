"use client"
import { useEffect } from "react";
import { getMyProfile, getCurrentSessionDatapoints } from "@/lib/front_end_api_service";
import { notificationService } from "@/lib/services/notification-service";

interface Datapoint {
  value: number;
  createdAt: string;
}

export function NotificationPoller() {
  useEffect(() => {
    const poll = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      try {
        const { devices: userDevices, username } = await getMyProfile(token);
        if (userDevices && username) {
          for (const device of userDevices) {
            console.log('Device data:', {
              deviceId: device.id,
              battery: device.battery,
              username
            });
            
            // Handle battery updates
            notificationService.handleBatteryUpdate(username, device.id, device.battery);
            
            // Get current session datapoints
            const sessionData = await getCurrentSessionDatapoints(device.id, token);
            // Filter out session delimiter datapoints (value = -1) and get the latest actual datapoint
            const validDatapoints = sessionData.datapoints.filter((dp: Datapoint) => dp.value !== -1);
            const latestDatapoint = validDatapoints[validDatapoints.length - 1]; // Get last datapoint as it's the latest
            
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