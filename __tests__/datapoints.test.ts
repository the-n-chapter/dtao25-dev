import axios from 'axios';

const API_BASE_URL = 'https://epsilon.proto.aalto.fi';

interface LoginResponse {
  token: string;
}

interface DatapointResponse {
  id: number;
  value: number;
  deviceHashedMACAddress: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiError {
  response?: {
    status: number;
  };
}

describe('Datapoint API Tests', () => {
  let token: string;
  const deviceHashedMACAddress = 'testdevice';

  beforeAll(async () => {
    try {
      // Login to get token
      const loginRes = await axios.post<LoginResponse>(`${API_BASE_URL}/login`, {
        username: 'user123',
        password: '1234'
      });
      token = loginRes.data.token;

      // Create test device
      await axios.post(
        `${API_BASE_URL}/devices`,
        { hashedMACAddress: deviceHashedMACAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error: unknown) {
      if ((error as ApiError).response?.status === 400) {
        console.log('Device might already exist, continuing with test');
      } else {
        throw error;
      }
    }
  });

  it('should add 50 decreasing datapoints using testdevice', async () => {
    // Start a session
    const sessionRes = await axios.post<DatapointResponse>(
      `${API_BASE_URL}/datapoints/startsession`,
      { 
        deviceHashedMACAddress,
        battery: 100
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(sessionRes.data.value).toBe(-1);
    expect(sessionRes.data.deviceHashedMACAddress).toBe(deviceHashedMACAddress);

    // Create and send 50 datapoints
    const startValue = 500;
    for (let i = 0; i < 50; i++) {
      const datapoint = {
        value: startValue - i * 5,
        battery: Math.max(1, 100 - i),
        deviceHashedMACAddress
      };

      console.log(`[${i + 1}/50] Creating datapoint:`, datapoint);
      const res = await axios.post<DatapointResponse>(
        `${API_BASE_URL}/datapoints`,
        datapoint,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`[${i + 1}/50] Created datapoint response:`, res.data);

      expect(res.data.value).toBe(datapoint.value);
      expect(res.data.deviceHashedMACAddress).toBe(deviceHashedMACAddress);
    }

    // Test passed - all 50 datapoints were created successfully
    expect(true).toBe(true);
  });
});