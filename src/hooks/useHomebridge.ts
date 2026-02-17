import { useState, useEffect, useCallback } from 'react';

export interface TemperatureSensor {
  name: string;
  temperature: number; // Celsius
  humidity?: number;
  occupancy?: boolean;
  isActive: boolean;
  uniqueId: string;
}

export interface HomebridgeSensorsData {
  sensors: TemperatureSensor[];
  lastUpdated: string;
}

interface UseHomebridgeResult {
  data: HomebridgeSensorsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseHomebridgeConfig {
  refreshInterval?: number; // milliseconds, default 5 minutes
  enabled?: boolean;
}

const API_BASE = '/api/homebridge';

export function useHomebridge(config: UseHomebridgeConfig = {}): UseHomebridgeResult {
  const { refreshInterval = 300000, enabled = true } = config; // 5 min default

  const [data, setData] = useState<HomebridgeSensorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSensors = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/sensors`);

      if (!response.ok) {
        throw new Error(`Failed to fetch sensors: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Keep existing data on error to avoid flickering
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchSensors();

    if (enabled && refreshInterval > 0) {
      const interval = setInterval(fetchSensors, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchSensors, refreshInterval, enabled]);

  return { data, loading, error, refetch: fetchSensors };
}

// Helper to convert Celsius to Fahrenheit
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9/5) + 32;
}

// Get a specific sensor by name
export function getSensorByName(
  sensors: TemperatureSensor[] | undefined,
  name: string
): TemperatureSensor | undefined {
  return sensors?.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
}
