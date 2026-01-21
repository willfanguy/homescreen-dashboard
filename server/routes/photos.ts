import { Router } from 'express';

export const photosRouter = Router();

// iCloud shared album base URL
const ICLOUD_BASE = 'https://p23-sharedstreams.icloud.com';

interface ICloudPhoto {
  url: string;
  width: number;
  height: number;
}

// Fetch photos from an iCloud shared album
async function fetchICloudAlbum(albumToken: string): Promise<ICloudPhoto[]> {
  let baseUrl = ICLOUD_BASE;

  // Step 1: Get the webstream data (may need to follow redirect via header)
  const streamResponse = await fetch(`${baseUrl}/${albumToken}/sharedstreams/webstream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Origin': 'https://www.icloud.com',
    },
    body: JSON.stringify({ streamCtag: null }),
  });

  // Check for redirect header
  const redirectHost = streamResponse.headers.get('X-Apple-MMe-Host');
  if (redirectHost) {
    baseUrl = `https://${redirectHost}`;
    // Retry with new host
    const retryResponse = await fetch(`${baseUrl}/${albumToken}/sharedstreams/webstream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Origin': 'https://www.icloud.com',
      },
      body: JSON.stringify({ streamCtag: null }),
    });

    if (!retryResponse.ok) {
      throw new Error(`Failed to fetch album stream: ${retryResponse.statusText}`);
    }

    var streamData = await retryResponse.json();
  } else {
    if (!streamResponse.ok) {
      throw new Error(`Failed to fetch album stream: ${streamResponse.statusText}`);
    }
    var streamData = await streamResponse.json();
  }

  const photos = streamData.photos || [];

  if (photos.length === 0) {
    return [];
  }

  // Step 2: Get the asset URLs
  const photoGuids = photos.map((p: any) => p.photoGuid);

  const assetResponse = await fetch(`${baseUrl}/${albumToken}/sharedstreams/webasseturls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Origin': 'https://www.icloud.com',
    },
    body: JSON.stringify({ photoGuids }),
  });

  if (!assetResponse.ok) {
    throw new Error(`Failed to fetch asset URLs: ${assetResponse.statusText}`);
  }

  const assetData = await assetResponse.json();
  const items = assetData.items || {};

  // Step 3: Build photo URLs - find derivative closest to display size
  // Full-res photos (12MP+) use ~48MB each when decoded in browser memory
  // Target 1920x1080 display to keep memory manageable on Pi
  const TARGET_SIZE = 1920 * 1080;
  const result: ICloudPhoto[] = [];

  for (const photo of photos) {
    const derivatives = photo.derivatives || {};

    // Find derivative closest to target display size (not largest)
    let bestDerivative: any = null;
    let bestDiff = Infinity;

    for (const key of Object.keys(derivatives)) {
      const d = derivatives[key];
      const size = (d.width || 0) * (d.height || 0);
      // Prefer sizes >= target, but pick closest overall
      const diff = Math.abs(size - TARGET_SIZE);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestDerivative = d;
      }
    }

    if (bestDerivative && bestDerivative.checksum) {
      const asset = items[bestDerivative.checksum];
      if (asset && asset.url_location && asset.url_path) {
        result.push({
          url: `https://${asset.url_location}${asset.url_path}`,
          width: bestDerivative.width || 1920,
          height: bestDerivative.height || 1080,
        });
      }
    }
  }

  return result;
}

// Get photos from iCloud shared album
photosRouter.get('/album/:albumToken', async (req, res) => {
  const { albumToken } = req.params;

  try {
    const photos = await fetchICloudAlbum(albumToken);
    res.json(photos);
  } catch (error) {
    console.error('iCloud album fetch error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch album',
    });
  }
});

// Status endpoint - iCloud doesn't need auth
photosRouter.get('/status', (_req, res) => {
  res.json({
    authenticated: true, // iCloud shared albums are public
    provider: 'icloud',
  });
});
