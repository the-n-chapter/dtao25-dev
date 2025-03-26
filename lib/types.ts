// User types
export interface User {
  id: number
  username: string
  Devices?: Device[]
}

export interface UserCreateRequest {
  username: string
  password: string
}

// Auth types
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
}

// Device types
export interface Device {
  id: number
  devicename: string
  owner: string
  Datapoints?: Datapoint[]
  status?: "online" | "offline"
  battery?: number
  moistureLevel?: number
  lastUpdated?: string
}

export interface DeviceCreateRequest {
  devicename: string
  owner: number
}

// Datapoint types
export interface Datapoint {
  id: number
  value: number
  receiveFrom: string
  createdAt: string
}

export interface DatapointCreateRequest {
  value: number
  receiveFrom: number
}

// Error types
export interface ApiErrorResponse {
  message: string;
}

// Response types
export interface CreateUserResponse {
  id: number;
  username: string;
}

export interface CreateDeviceResponse {
  id: number;
  devicename: string;
  owner: string;
}

export interface CreateDatapointResponse {
  id: number;
  value: number;
  receiveFrom: string;
}

export interface ResetDatabaseResponse {
  message: string;
}

