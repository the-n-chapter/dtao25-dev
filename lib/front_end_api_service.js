import axios from 'axios';

const API_BASE_URL = 'https://epsilon.proto.aalto.fi/api';

const headers = (token) => ({
  'Content-Type': 'application/json',
  ...(token && { Authorization: `Bearer ${token}` }),
});

// User APIs
export const createUser = async ({ username, password }) => {
  const { data } = await axios.post(`${API_BASE_URL}/users`, { username, password }, { headers: headers() });
  const { id, username: createdUsername } = data;
  return { id, username: createdUsername };
};

export const getUsers = async () => {
  const { data } = await axios.get(`${API_BASE_URL}/users`, { headers: headers() });
  return data.map(({ id, username, Devices }) => ({ id, username, devices: Devices }));
};

export const getUserById = async (id) => {
  const { data } = await axios.get(`${API_BASE_URL}/users/${id}`, { headers: headers() });
  const { id: userId, username, Devices } = data;
  return { id: userId, username, devices: Devices };
};

export const deleteUser = async (id, token) => {
  await axios.delete(`${API_BASE_URL}/users/${id}`, { headers: headers(token) });
};

export const getMyProfile = async (token) => {
  const { data } = await axios.get(`${API_BASE_URL}/users/myprofile`, { headers: headers(token) });
  console.log('[DEBUG] getMyProfile full response:', JSON.stringify(data, null, 2));
  
  // Fetch complete device details for each device
  const devicePromises = data.Devices.map(device => 
    getDeviceById(device.id, token)
  );
  
  const devices = await Promise.all(devicePromises);
  console.log('[DEBUG] Complete device details:', JSON.stringify(devices, null, 2));
  
  return { 
    id: data.id, 
    username: data.username, 
    devices 
  };
};

// Login APIs
export const login = async ({ username, password }) => {
  const { data } = await axios.post(`${API_BASE_URL}/login`, { username, password }, { headers: headers() });
  const { token } = data;
  return token;
};

// Device APIs
export const createDevice = async ({ hashedMACAddress }, token) => {
  const { data } = await axios.post(`${API_BASE_URL}/devices`, { hashedMACAddress }, { headers: headers(token) });
  const { id, hashedMACAddress: createdDevicename, owner } = data;
  return { id, hashedMACAddress: createdDevicename, owner };
};

export const getDevices = async () => {
  const { data } = await axios.get(`${API_BASE_URL}/devices`, { headers: headers() });
  console.log('[DEBUG] getDevices response:', JSON.stringify(data, null, 2));
  const mappedDevices = data.map((device) => {
    console.log('[DEBUG] Raw device object:', JSON.stringify(device, null, 2));
    return {
      id: device.id,
      hashedMACAddress: device.hashedMACAddress || device.HashedMACAddress,
      owner: device.owner || device.Owner,
      battery: device.battery || device.Battery,
      datapoints: device.Datapoints || device.datapoints
    };
  });
  console.log('[DEBUG] Mapped devices:', mappedDevices);
  return mappedDevices;
};

export const getDeviceById = async (deviceId, token) => {
  if (!token) {
    token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("No authentication token found");
    }
  }
  const { data } = await axios.get(`${API_BASE_URL}/devices/${deviceId}`, { headers: headers(token) });
  console.log('[DEBUG] getDeviceById response:', JSON.stringify(data, null, 2));
  return { 
    id: data.id,
    hashedMACAddress: data.hashedMACAddress || data.HashedMACAddress,
    owner: data.owner || data.Owner,
    battery: data.battery || data.Battery,
    datapoints: data.Datapoints || data.datapoints
  };
};

export const deleteDevice = async (id, token) => {
  await axios.delete(`${API_BASE_URL}/devices/${id}`, { headers: headers(token) });
};

// Datapoint APIs
export const createDatapoint = async ({ value, deviceHashedMACAddress, battery }) => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    throw new Error("No authentication token found");
  }
  const { data } = await axios.post(
    `${API_BASE_URL}/datapoints`,
    { value, deviceHashedMACAddress, battery },
    { headers: headers(token) }
  );
  const { id, value: createdValue, deviceHashedMACAddress: createdReceiveFrom } = data;
  return { id, value: createdValue, deviceHashedMACAddress: createdReceiveFrom };
};

export const getDatapointsByDeviceId = async (deviceHashedMACAddress) => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    throw new Error("No authentication token found");
  }
  const { data } = await axios.get(`${API_BASE_URL}/datapoints/device/${deviceHashedMACAddress}`, { headers: headers(token) });
  return data.map(({ value, createdAt }) => ({ value, createdAt }));
};

export const startSession = async (deviceHashedMACAddress, token, battery = 12) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/datapoints/startsession`,
    { 
      deviceHashedMACAddress,
      battery
    },
    { headers: headers(token) }
  );
  const { value, deviceHashedMACAddress: createdDeviceHashedMACAddress } = data;
  return { value, deviceHashedMACAddress: createdDeviceHashedMACAddress };
};

export const getCurrentSessionDatapoints = async (deviceHashedMACAddress, token) => {
  const { data } = await axios.get(`${API_BASE_URL}/datapoints/currentsession/${deviceHashedMACAddress}`, { headers: headers(token) });
  const { averageSlope, datapoints } = data;
  return { averageSlope, datapoints };
};

// Admin APIs
export const resetDatabase = async (adminpassword) => {
  const { data } = await axios.delete(`${API_BASE_URL}/admin/reset`, {
    headers: headers(),
    data: { adminpassword },
  });
  const { message } = data;
  return message;
};
