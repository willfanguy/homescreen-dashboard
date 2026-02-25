import { useState, useEffect } from 'react';
import type { WeatherAlert } from '../types/dashboard';

interface NWSAlertsConfig {
  lat: number;
  lon: number;
}

interface UseNWSAlertsResult {
  alerts: WeatherAlert[];
  loading: boolean;
  error: string | null;
}

// National Weather Service API - free, no API key required
const NWS_API_BASE = 'https://api.weather.gov';

export function useNWSAlerts(config: NWSAlertsConfig): UseNWSAlertsResult {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${NWS_API_BASE}/alerts/active?point=${config.lat},${config.lon}`,
          {
            headers: {
              'User-Agent': 'HomeScreenDashboard/1.0',
              'Accept': 'application/geo+json',
            },
            signal,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch NWS alerts');
        }

        const data = await response.json();

        const parsedAlerts: WeatherAlert[] = (data.features || []).map((feature: any) => {
          const props = feature.properties;
          return {
            title: props.headline || props.event,
            description: props.description || '',
            severity: mapNWSSeverity(props.severity),
            start: new Date(props.effective),
            end: new Date(props.expires),
          };
        });

        // Sort by severity (most severe first)
        const severityOrder = { extreme: 0, severe: 1, moderate: 2, minor: 3 };
        parsedAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        setAlerts(parsedAlerts);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    const controller = new AbortController();
    fetchAlerts(controller.signal);

    // Refresh alerts every 5 minutes
    const interval = setInterval(() => fetchAlerts(controller.signal), 5 * 60 * 1000);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [config.lat, config.lon]);

  return { alerts, loading, error };
}

function mapNWSSeverity(severity: string): 'minor' | 'moderate' | 'severe' | 'extreme' {
  switch (severity?.toLowerCase()) {
    case 'extreme':
      return 'extreme';
    case 'severe':
      return 'severe';
    case 'moderate':
      return 'moderate';
    case 'minor':
    case 'unknown':
    default:
      return 'minor';
  }
}
