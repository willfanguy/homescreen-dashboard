import { useState, useEffect, useCallback, useRef } from 'react';
import type { Photo } from '../types/dashboard';

interface PhotosConfig {
  albumToken?: string;
}

interface UsePhotosResult {
  photos: Photo[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const API_BASE = '/api/photos';
const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour
const ERROR_RETRY_INTERVAL = 30_000; // 30 seconds

export function usePhotos(config: PhotosConfig): UsePhotosResult {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);

  const fetchPhotos = useCallback(async () => {
    if (!config.albumToken) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/album/${config.albumToken}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch photos');
      }

      const data: Photo[] = await response.json();

      // Only update state if photo URLs actually changed to avoid resetting
      // the current photo index in PhotoBackground
      setPhotos(prev => {
        if (prev.length === data.length && prev.every((p, i) => p.url === data[i].url)) {
          return prev;
        }
        return data;
      });
      setError(null);
      hasLoaded.current = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      // Only show error if we've never successfully loaded photos
      if (!hasLoaded.current) {
        setError(message);
      }
      // Schedule a retry
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
      retryTimeout.current = setTimeout(fetchPhotos, ERROR_RETRY_INTERVAL);
    } finally {
      setLoading(false);
    }
  }, [config.albumToken]);

  useEffect(() => {
    fetchPhotos();

    const interval = setInterval(fetchPhotos, REFRESH_INTERVAL);
    return () => {
      clearInterval(interval);
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
    };
  }, [fetchPhotos]);

  return {
    photos,
    loading,
    error,
    refetch: fetchPhotos,
  };
}
