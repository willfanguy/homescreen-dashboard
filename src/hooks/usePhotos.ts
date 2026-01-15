import { useState, useEffect } from 'react';
import type { Photo, PhotoSource } from '../types/dashboard';

interface UsePhotosResult {
  photos: Photo[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePhotos(source: PhotoSource): UsePhotosResult {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);

    try {
      if (source.type === 'icloud' && source.albumId) {
        // iCloud Shared Albums can be accessed via their public URL
        // This requires reverse-engineering the iCloud shared album API
        // For now, we'll use a placeholder that you can swap out
        const icloudPhotos = await fetchICloudSharedAlbum(source.albumId);
        setPhotos(icloudPhotos);
      } else if (source.type === 'local' && source.localPath) {
        // For local photos, the Pi would need a small server to list files
        // This is a placeholder
        setPhotos([]);
      } else {
        setPhotos([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();

    // Refresh photo list every hour
    const interval = setInterval(fetchPhotos, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [source]);

  return { photos, loading, error, refetch: fetchPhotos };
}

// iCloud Shared Album fetcher
// This uses the undocumented iCloud shared album API
// The album must be set to "Public Website" in iCloud settings
async function fetchICloudSharedAlbum(albumId: string): Promise<Photo[]> {
  try {
    // Step 1: Get the webstream data
    const baseUrl = `https://p133-sharedstreams.icloud.com/${albumId}/sharedstreams`;

    // Fetch the webstream metadata
    const response = await fetch(`${baseUrl}/webstream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ streamCtag: null }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch iCloud album');
    }

    const data = await response.json();

    // Extract photo URLs from the response
    const photos: Photo[] = [];

    if (data.photos) {
      for (const photo of data.photos) {
        if (photo.derivatives) {
          // Get the largest available derivative
          const derivatives = Object.values(photo.derivatives) as Array<{
            checksum: string;
            width: number;
            height: number;
          }>;
          const largest = derivatives.reduce((a, b) =>
            (a.width * a.height) > (b.width * b.height) ? a : b
          );

          if (largest.checksum) {
            // Construct the image URL
            const photoUrl = `${baseUrl}/asset/${largest.checksum}.jpeg`;
            photos.push({
              url: photoUrl,
              width: largest.width,
              height: largest.height,
            });
          }
        }
      }
    }

    return photos;
  } catch (err) {
    console.error('iCloud fetch error:', err);
    // Return empty array on error - could also return placeholder images
    return [];
  }
}
