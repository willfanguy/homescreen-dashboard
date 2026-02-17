import { Router } from 'express';

export const photosRouter = Router();

// iCloud shared album base URL
const ICLOUD_BASE = 'https://p23-sharedstreams.icloud.com';

interface ICloudPhoto {
  url: string;
  width: number;
  height: number;
}

// In-memory cache: album token -> { photos, timestamp }
const photoCache = new Map<string, { photos: ICloudPhoto[]; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Cache the redirect host so we don't hit the 330 endpoint every time
let cachedRedirectHost: string | null = null;

// iCloud's redirect host intermittently returns 403 on first requests.
// Retry with backoff to handle this.
async function iCloudPost(url: string, body: any, retries = 5): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Origin': 'https://www.icloud.com',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) return response;

    if (response.status !== 403 || attempt === retries) {
      throw new Error(`iCloud API error: ${response.status} ${response.statusText} (${url})`);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('unreachable');
}

// Resolve the redirect host (iCloud returns custom 330 with X-Apple-MMe-Host)
async function resolveRedirectHost(albumToken: string): Promise<string> {
  if (cachedRedirectHost) return cachedRedirectHost;

  const response = await fetch(`${ICLOUD_BASE}/${albumToken}/sharedstreams/webstream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Origin': 'https://www.icloud.com',
    },
    body: JSON.stringify({ streamCtag: null }),
  });

  const redirectHost = response.headers.get('X-Apple-MMe-Host');
  if (redirectHost) {
    cachedRedirectHost = redirectHost;
    return redirectHost;
  }

  // No redirect -- use default host
  return ICLOUD_BASE.replace('https://', '');
}

// Fetch photos from an iCloud shared album
async function fetchICloudAlbum(albumToken: string): Promise<ICloudPhoto[]> {
  const host = await resolveRedirectHost(albumToken);
  const baseUrl = `https://${host}`;

  // Step 1: Get the webstream data
  const streamResponse = await iCloudPost(`${baseUrl}/${albumToken}/sharedstreams/webstream`, { streamCtag: null });
  const streamData = await streamResponse.json();
  const photos = streamData.photos || [];

  if (photos.length === 0) {
    return [];
  }

  // Step 2: Get the asset URLs
  const photoGuids = photos.map((p: any) => p.photoGuid);
  const assetResponse = await iCloudPost(`${baseUrl}/${albumToken}/sharedstreams/webasseturls`, { photoGuids });
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

// Get photos from iCloud shared album (with caching)
photosRouter.get('/album/:albumToken', async (req, res) => {
  const { albumToken } = req.params;
  const cached = photoCache.get(albumToken);

  try {
    const photos = await fetchICloudAlbum(albumToken);
    photoCache.set(albumToken, { photos, timestamp: Date.now() });
    res.json(photos);
  } catch (error) {
    console.error('iCloud album fetch error:', error);

    // Return cached photos if available (even if stale)
    if (cached && cached.photos.length > 0) {
      console.log(`Serving ${cached.photos.length} cached photos (from ${Math.round((Date.now() - cached.timestamp) / 60000)}m ago)`);
      res.json(cached.photos);
      return;
    }

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
