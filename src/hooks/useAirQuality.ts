import { useState, useEffect } from 'react';

export interface AirQualityData {
  aqi: number;
  category: string;
  color: string;
}

interface AirQualityConfig {
  lat: number;
  lon: number;
}

interface UseAirQualityResult {
  data: AirQualityData | null;
  loading: boolean;
  error: string | null;
}

// Open-Meteo Air Quality API - free, no API key required
const AIR_QUALITY_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export function useAirQuality(config: AirQualityConfig): UseAirQualityResult {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAirQuality = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          latitude: config.lat.toString(),
          longitude: config.lon.toString(),
          current: 'us_aqi',
          timezone: 'auto',
        });

        const response = await fetch(`${AIR_QUALITY_BASE}?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch air quality data');
        }

        const json = await response.json();
        const aqi = json.current.us_aqi;

        setData({
          aqi,
          category: getAqiCategory(aqi),
          color: getAqiColor(aqi),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAirQuality();

    // Refresh every 30 minutes
    const interval = setInterval(fetchAirQuality, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [config.lat, config.lon]);

  return { data, loading, error };
}

function getAqiCategory(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

function getAqiColor(aqi: number): string {
  if (aqi <= 50) return '#00e400';
  if (aqi <= 100) return '#ffff00';
  if (aqi <= 150) return '#ff7e00';
  if (aqi <= 200) return '#ff0000';
  if (aqi <= 300) return '#8f3f97';
  return '#7e0023';
}
