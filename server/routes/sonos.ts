import { Router } from 'express';

export const sonosRouter = Router();

// Sonos HTTP API base URL - can be overridden via environment variable
const SONOS_API_URL = process.env.SONOS_API_URL || 'http://192.168.0.155:5005';

interface SonosTrack {
  artist: string;
  title: string;
  album: string;
  albumArtUri: string;
  absoluteAlbumArtUri: string;
  duration: number;
}

interface SonosZoneState {
  volume: number;
  mute: boolean;
  playbackState: 'PLAYING' | 'PAUSED_PLAYBACK' | 'STOPPED';
  currentTrack: SonosTrack;
}

interface SonosZone {
  uuid: string;
  roomName: string;
  state: SonosZoneState;
}

interface NowPlayingInfo {
  roomName: string;
  isPlaying: boolean;
  isPaused: boolean;
  artist: string;
  title: string;
  album: string;
  albumArtUrl: string | null;
  volume: number;
}

// Get all zones with current state
// GET /api/sonos/zones
sonosRouter.get('/zones', async (_req, res) => {
  try {
    const response = await fetch(`${SONOS_API_URL}/zones`);

    if (!response.ok) {
      throw new Error(`Sonos API error: ${response.statusText}`);
    }

    const zones = await response.json();
    res.json(zones);
  } catch (error) {
    console.error('Sonos zones fetch error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch Sonos zones'
    });
  }
});

// Get simplified "now playing" data - only zones that are playing or paused with content
// GET /api/sonos/now-playing
sonosRouter.get('/now-playing', async (_req, res) => {
  try {
    const response = await fetch(`${SONOS_API_URL}/zones`);

    if (!response.ok) {
      throw new Error(`Sonos API error: ${response.statusText}`);
    }

    const zones: SonosZone[] = (await response.json()).map((zone: any) => ({
      uuid: zone.uuid,
      roomName: zone.coordinator.roomName,
      state: zone.coordinator.state,
    }));

    // Filter to zones with actual content (playing or paused with a track)
    const activeZones: NowPlayingInfo[] = zones
      .filter(zone => {
        const state = zone.state;
        const hasTrack = state.currentTrack?.title && state.currentTrack.title.length > 0;
        const isActive = state.playbackState === 'PLAYING' || state.playbackState === 'PAUSED_PLAYBACK';
        return hasTrack && isActive;
      })
      .map(zone => ({
        roomName: zone.roomName,
        isPlaying: zone.state.playbackState === 'PLAYING',
        isPaused: zone.state.playbackState === 'PAUSED_PLAYBACK',
        artist: zone.state.currentTrack.artist || '',
        title: zone.state.currentTrack.title || '',
        album: zone.state.currentTrack.album || '',
        albumArtUrl: zone.state.currentTrack.absoluteAlbumArtUri || null,
        volume: zone.state.volume,
      }));

    // Sort: playing first, then paused
    activeZones.sort((a, b) => {
      if (a.isPlaying && !b.isPlaying) return -1;
      if (!a.isPlaying && b.isPlaying) return 1;
      return 0;
    });

    res.json({
      hasActivePlayback: activeZones.some(z => z.isPlaying),
      zones: activeZones,
    });
  } catch (error) {
    console.error('Sonos now-playing fetch error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch Sonos state',
      hasActivePlayback: false,
      zones: [],
    });
  }
});

// Proxy album art to avoid CORS issues
// GET /api/sonos/album-art?url=<encoded-url>
sonosRouter.get('/album-art', async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch album art: ${response.statusText}`
      });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    res.type(contentType);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Album art fetch error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch album art'
    });
  }
});
