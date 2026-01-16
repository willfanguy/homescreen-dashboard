import { useState, useEffect, useCallback } from 'react';

export interface SonosNowPlayingZone {
  roomName: string;
  isPlaying: boolean;
  isPaused: boolean;
  artist: string;
  title: string;
  album: string;
  albumArtUrl: string | null;
  volume: number;
}

export interface SonosNowPlayingData {
  hasActivePlayback: boolean;
  zones: SonosNowPlayingZone[];
}

interface UseSonosResult {
  data: SonosNowPlayingData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseSonosConfig {
  refreshInterval?: number; // milliseconds, default 10 seconds
  enabled?: boolean;
}

const API_BASE = 'http://localhost:3001/api/sonos';

export function useSonos(config: UseSonosConfig = {}): UseSonosResult {
  const { refreshInterval = 10000, enabled = true } = config;

  const [data, setData] = useState<SonosNowPlayingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNowPlaying = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/now-playing`);

      if (!response.ok) {
        throw new Error(`Failed to fetch Sonos state: ${response.statusText}`);
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
    fetchNowPlaying();

    if (enabled && refreshInterval > 0) {
      const interval = setInterval(fetchNowPlaying, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchNowPlaying, refreshInterval, enabled]);

  return { data, loading, error, refetch: fetchNowPlaying };
}

// Helper to get proxied album art URL (avoids CORS)
export function getProxiedAlbumArtUrl(originalUrl: string | null): string | null {
  if (!originalUrl) return null;
  return `${API_BASE}/album-art?url=${encodeURIComponent(originalUrl)}`;
}
