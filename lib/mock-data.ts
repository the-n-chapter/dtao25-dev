import { STORAGE_KEYS } from "./config"
import { type User, type Device, type Datapoint, ApiError } from "./types"

// Initialize mock data if not present
export const initializeMockData = (): void => {
  // Check if users exist
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]))
    localStorage.setItem(STORAGE_KEYS.USER_ID_COUNTER, "1")
  }

  // Check if devices exist
  if (!localStorage.getItem(STORAGE_KEYS.DEVICES)) {
    localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify([]))
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID_COUNTER, "1")
  }

  // Check if datapoints exist
  if (!localStorage.getItem(STORAGE_KEYS.DATAPOINTS)) {
    localStorage.setItem(STORAGE_KEYS.DATAPOINTS, JSON.stringify([]))
    localStorage.setItem(STORAGE_KEYS.DATAPOINT_ID_COUNTER, "1")
  }
}

// Get next ID for a specific entity
export const getNextId = (counterKey: string): number => {
  const currentId = Number.parseInt(localStorage.getItem(counterKey) || "1")
  localStorage.setItem(counterKey, (currentId + 1).toString())
  return currentId
}

// Helper to get all users
export const getAllUsers = (): User[] => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")
}

// Helper to get all devices
export const getAllDevices = (): Device[] => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.DEVICES) || "[]")
}

// Helper to get all datapoints
export const getAllDatapoints = (): Datapoint[] => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.DATAPOINTS) || "[]")
}

// Helper to save users
export const saveUsers = (users: User[]): void => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

// Helper to save devices
export const saveDevices = (devices: Device[]): void => {
  localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices))
}

// Helper to save datapoints
export const saveDatapoints = (datapoints: Datapoint[]): void => {
  localStorage.setItem(STORAGE_KEYS.DATAPOINTS, JSON.stringify(datapoints))
}

// Helper to get user by ID
export const getUserById = (id: number): User | null => {
  const users = getAllUsers()
  return users.find((user) => user.id === id) || null
}

// Helper to get device by ID
export const getDeviceById = (id: number): Device | null => {
  const devices = getAllDevices()
  return devices.find((device) => device.id === id) || null
}

// Helper to get datapoint by ID
export const getDatapointById = (id: number): Datapoint | null => {
  const datapoints = getAllDatapoints()
  return datapoints.find((datapoint) => datapoint.id === id) || null
}

// Helper to reset the database (for testing)
export const resetDatabase = (adminPassword: string): void => {
  // In a real app, this would check against an environment variable
  if (adminPassword !== "admin-password") {
    throw new ApiError(403, "Unauthorized: Incorrect admin password")
  }

  localStorage.removeItem(STORAGE_KEYS.USERS)
  localStorage.removeItem(STORAGE_KEYS.DEVICES)
  localStorage.removeItem(STORAGE_KEYS.DATAPOINTS)
  localStorage.removeItem(STORAGE_KEYS.USER_ID_COUNTER)
  localStorage.removeItem(STORAGE_KEYS.DEVICE_ID_COUNTER)
  localStorage.removeItem(STORAGE_KEYS.DATAPOINT_ID_COUNTER)

  initializeMockData()
}

