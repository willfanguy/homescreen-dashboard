import { useState, useEffect, useCallback } from 'react';
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

const API_BASE = 'http://localhost:3001/api/photos';

export function usePhotos(config: PhotosConfig): UsePhotosResult {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    if (!config.albumToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/album/${config.albumToken}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch photos');
      }

      const data = await response.json();
      setPhotos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [config.albumToken]);

  useEffect(() => {
    fetchPhotos();

    // Refresh photos every hour
    const interval = setInterval(fetchPhotos, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPhotos]);

  return {
    photos,
    loading,
    error,
    refetch: fetchPhotos,
  };
}
