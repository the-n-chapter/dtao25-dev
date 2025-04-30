import axios from 'axios';

const API_BASE_URL = 'https://epsilon.proto.aalto.fi';

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
  const { id: userId, username, Devices } = data;
  return { id: userId, username, devices: Devices };
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
  return data.map(({ id, hashedMACAddress, owner, Datapoints }) => ({
    id,
    hashedMACAddress,
    owner,
    datapoints: Datapoints,
  }));
};

export const getDeviceById = async (id) => {
  const { data } = await axios.get(`${API_BASE_URL}/devices/${id}`, { headers: headers() });
  const { id: deviceId, hashedMACAddress, owner, Datapoints } = data;
  return { id: deviceId, hashedMACAddress, owner, datapoints: Datapoints };
};

export const deleteDevice = async (id, token) => {
  await axios.delete(`${API_BASE_URL}/devices/${id}`, { headers: headers(token) });
};

// Datapoint APIs
export const createDatapoint = async ({ value, deviceHashedMACAddress, battery }) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/datapoints`,
    { value, deviceHashedMACAddress, battery },
    { headers: headers() }
  );
  const { id, value: createdValue, deviceHashedMACAddress: createdReceiveFrom } = data;
  return { id, value: createdValue, deviceHashedMACAddress: createdReceiveFrom };
};

export const getDatapointsByDeviceId = async (deviceId) => {
  const { data } = await axios.get(`${API_BASE_URL}/datapoints/device/${deviceId}`, { headers: headers() });
  return data.map(({ value, createdAt }) => ({ value, createdAt }));
};

export const startSession = async (deviceId, token) => {
  const { data } = await axios.post(
    `${API_BASE_URL}/datapoints/startsession`,
    { deviceId },
    { headers: headers(token) }
  );
  const { id, value, deviceHashedMACAddress } = data;
  return { id, value, deviceHashedMACAddress };
};

export const getCurrentSessionDatapoints = async (deviceId, token) => {
  const { data } = await axios.get(`${API_BASE_URL}/datapoints/currentsession/${deviceId}`, { headers: headers(token) });
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