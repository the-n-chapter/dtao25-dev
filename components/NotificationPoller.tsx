"use client"
import { useEffect } from "react";
import { getMyProfile } from "@/lib/front_end_api_service";
import { notificationService } from "@/lib/services/notification-service";

export function NotificationPoller() {
  useEffect(() => {
    const poll = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      try {
        const { devices: userDevices, username } = await getMyProfile(token);
        if (userDevices && username) {
          userDevices.forEach(device => {
            notificationService.handleBatteryUpdate(username, device.id, device.battery);
            const latestDatapoint = device.datapoints[device.datapoints.length - 1];
            if (latestDatapoint) {
              const moisturePercentage = Math.round((latestDatapoint.value / 3300) * 100);
              notificationService.handleMoistureUpdate(username, device.id, moisturePercentage);
            }
          });
        }
      } catch {
        // Optionally log error
      }
    };
    poll(); // Run once on mount
    const interval = setInterval(poll, 1000 * 60); // Every minute
    return () => clearInterval(interval);
  }, []);
  return null;
} 