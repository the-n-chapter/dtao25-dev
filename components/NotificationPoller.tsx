"use client"
import { useEffect } from "react";
import { getMyProfile, getCurrentSessionDatapoints } from "@/lib/front_end_api_service";
import { notificationService } from "@/lib/services/notification-service";

type Datapoint = {
  value: number;
  createdAt: string;
};

const MIN_MOISTURE_THRESHOLD = 100; // Minimum threshold to prevent false 100% readings

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
            
            if (validDatapoints.length > 0) {
              // Calculate moisture percentage using the same method as device details page
              const actualMax = Math.max(...validDatapoints.map((dp: Datapoint) => dp.value));
              const latestValue = validDatapoints[validDatapoints.length - 1].value;
              
              let moisturePercentage;
              if (actualMax < 100) {
                moisturePercentage = Math.round((latestValue / 100) * 10);
              } else {
                const effectiveMax = Math.max(actualMax, MIN_MOISTURE_THRESHOLD);
                moisturePercentage = Math.min(100, Math.round((latestValue / effectiveMax) * 100));
              }
              
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