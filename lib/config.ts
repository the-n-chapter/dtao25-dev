export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.smartpin.com"

// JWT Secret for mock API (in a real app, this would be server-side only)
export const JWT_SECRET = "mock-jwt-secret-key-for-development-only"

// Simulated network delay (ms) for mock API
export const MOCK_API_DELAY = 500

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  CURRENT_USER: "currentUser",
  USERS: "users",
  DEVICES: "devices",
  DATAPOINTS: "datapoints",
  USER_ID_COUNTER: "userIdCounter",
  DEVICE_ID_COUNTER: "deviceIdCounter",
  DATAPOINT_ID_COUNTER: "datapointIdCounter",
}

// Helper to simulate API delay
export const simulateNetworkDelay = async (): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, MOCK_API_DELAY))
}

// Flag to determine whether to use mock or real API
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false"

// Regular expression for validating no whitespace
export const NO_WHITESPACE_REGEX = /^[^\s]+$/

// Helper to validate parameters
export const validateParams = (...args: any[]): boolean => {
  return !args.includes(undefined) && !args.includes(null)
}

