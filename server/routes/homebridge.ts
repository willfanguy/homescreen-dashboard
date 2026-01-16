import { Router } from 'express';

export const homebridgeRouter = Router();

// Token cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// Get config lazily (after dotenv has loaded)
function getConfig() {
  return {
    url: process.env.HOMEBRIDGE_URL || 'http://localhost:8581',
    username: process.env.HOMEBRIDGE_USERNAME,
    password: process.env.HOMEBRIDGE_PASSWORD,
  };
}

// Get a valid JWT token, refreshing if needed
async function getAuthToken(): Promise<string> {
  const config = getConfig();
  if (!config.username || !config.password) {
    throw new Error('HOMEBRIDGE_USERNAME and HOMEBRIDGE_PASSWORD environment variables required');
  }

  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  const response = await fetch(`${config.url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: config.username,
      password: config.password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Homebridge auth failed: ${response.statusText}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // expires_in is in seconds
  tokenExpiry = Date.now() + (data.expires_in * 1000);

  return cachedToken;
}

// Helper to make authenticated requests
async function homebridgeFetch(endpoint: string): Promise<any> {
  const config = getConfig();
  const token = await getAuthToken();

  const response = await fetch(`${config.url}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Homebridge API error: ${response.statusText}`);
  }

  return response.json();
}

// Types for accessory data
interface TemperatureSensor {
  name: string;
  temperature: number; // Celsius
  humidity?: number;
  occupancy?: boolean;
  isActive: boolean;
  uniqueId: string;
}

interface LightAccessory {
  name: string;
  isOn: boolean;
  brightness?: number;
  uniqueId: string;
}

interface HomebridgeSummary {
  sensors: TemperatureSensor[];
  lights: LightAccessory[];
  lastUpdated: string;
}

// GET /api/homebridge/accessories - raw accessories list
homebridgeRouter.get('/accessories', async (_req, res) => {
  try {
    const accessories = await homebridgeFetch('/api/accessories');
    res.json(accessories);
  } catch (error) {
    console.error('Homebridge accessories fetch error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch accessories',
    });
  }
});

// GET /api/homebridge/sensors - filtered temperature/humidity sensors
homebridgeRouter.get('/sensors', async (_req, res) => {
  try {
    const accessories = await homebridgeFetch('/api/accessories');

    // Build a map of sensors by serviceName to combine temp/humidity/occupancy
    const sensorMap = new Map<string, TemperatureSensor>();

    for (const accessory of accessories) {
      // Temperature sensors
      if (accessory.type === 'TemperatureSensor') {
        const name = accessory.serviceName;
        const existing = sensorMap.get(name) || {
          name,
          temperature: 0,
          isActive: true,
          uniqueId: accessory.uniqueId,
        };
        existing.temperature = accessory.values?.CurrentTemperature ?? 0;
        existing.isActive = accessory.values?.StatusActive !== 0;
        sensorMap.set(name, existing);
      }

      // Humidity sensors (usually paired with temperature)
      if (accessory.type === 'HumiditySensor') {
        const name = accessory.serviceName;
        const existing = sensorMap.get(name) || {
          name,
          temperature: 0,
          isActive: true,
          uniqueId: accessory.uniqueId,
        };
        existing.humidity = accessory.values?.CurrentRelativeHumidity;
        sensorMap.set(name, existing);
      }

      // Occupancy sensors
      if (accessory.type === 'OccupancySensor') {
        const name = accessory.serviceName;
        const existing = sensorMap.get(name);
        if (existing) {
          existing.occupancy = accessory.values?.OccupancyDetected === 1;
        }
      }
    }

    const sensors = Array.from(sensorMap.values());

    res.json({
      sensors,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Homebridge sensors fetch error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch sensors',
      sensors: [],
    });
  }
});

// GET /api/homebridge/lights - light accessories
homebridgeRouter.get('/lights', async (_req, res) => {
  try {
    const accessories = await homebridgeFetch('/api/accessories');

    const lights: LightAccessory[] = accessories
      .filter((a: any) => a.type === 'Lightbulb')
      .map((a: any) => ({
        name: a.serviceName,
        isOn: a.values?.On === 1 || a.values?.On === true,
        brightness: a.values?.Brightness,
        uniqueId: a.uniqueId,
      }));

    res.json({
      lights,
      lightsOn: lights.filter(l => l.isOn).length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Homebridge lights fetch error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch lights',
      lights: [],
      lightsOn: 0,
    });
  }
});

// GET /api/homebridge/summary - combined dashboard data
homebridgeRouter.get('/summary', async (_req, res) => {
  try {
    const accessories = await homebridgeFetch('/api/accessories');

    // Build sensors
    const sensorMap = new Map<string, TemperatureSensor>();
    for (const accessory of accessories) {
      if (accessory.type === 'TemperatureSensor') {
        const name = accessory.serviceName;
        const existing = sensorMap.get(name) || {
          name,
          temperature: 0,
          isActive: true,
          uniqueId: accessory.uniqueId,
        };
        existing.temperature = accessory.values?.CurrentTemperature ?? 0;
        existing.isActive = accessory.values?.StatusActive !== 0;
        sensorMap.set(name, existing);
      }
      if (accessory.type === 'HumiditySensor') {
        const name = accessory.serviceName;
        const existing = sensorMap.get(name) || {
          name,
          temperature: 0,
          isActive: true,
          uniqueId: accessory.uniqueId,
        };
        existing.humidity = accessory.values?.CurrentRelativeHumidity;
        sensorMap.set(name, existing);
      }
      if (accessory.type === 'OccupancySensor') {
        const name = accessory.serviceName;
        const existing = sensorMap.get(name);
        if (existing) {
          existing.occupancy = accessory.values?.OccupancyDetected === 1;
        }
      }
    }

    // Build lights
    const lights: LightAccessory[] = accessories
      .filter((a: any) => a.type === 'Lightbulb')
      .map((a: any) => ({
        name: a.serviceName,
        isOn: a.values?.On === 1 || a.values?.On === true,
        brightness: a.values?.Brightness,
        uniqueId: a.uniqueId,
      }));

    const summary: HomebridgeSummary = {
      sensors: Array.from(sensorMap.values()),
      lights,
      lastUpdated: new Date().toISOString(),
    };

    res.json(summary);
  } catch (error) {
    console.error('Homebridge summary fetch error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch summary',
      sensors: [],
      lights: [],
    });
  }
});
