import { useSonos, getProxiedAlbumArtUrl } from '../../hooks/useSonos';
import { config } from '../../config';

interface SonosNowPlayingProps {
  refreshInterval?: number;
  showPausedContent?: boolean; // Whether to show paused tracks or only actively playing
}

// Get display name for a Sonos zone
function getDisplayName(zoneName: string): string {
  return config.sonos.roomNames[zoneName] || zoneName;
}

export function SonosNowPlaying({
  refreshInterval = 10000,
  showPausedContent = false,
}: SonosNowPlayingProps) {
  const { data, loading, error } = useSonos({ refreshInterval });

  // Don't show anything while loading initially
  if (loading && !data) {
    return null;
  }

  // Don't show on error (fail silently for ambient display)
  if (error && !data) {
    return null;
  }

  // Filter zones based on showPausedContent setting
  const visibleZones = data?.zones.filter(zone =>
    showPausedContent ? true : zone.isPlaying
  ) || [];

  // Nothing playing/paused
  if (visibleZones.length === 0) {
    return null;
  }

  // Show the first active zone (prioritizes playing over paused)
  const zone = visibleZones[0];
  const albumArtUrl = getProxiedAlbumArtUrl(zone.albumArtUrl);

  return (
    <div className="sonos-now-playing">
      {albumArtUrl && (
        <div
          className="sonos-album-art"
          style={{ backgroundImage: `url(${albumArtUrl})` }}
        />
      )}
      <div className="sonos-track-info">
        <div className="sonos-title">{zone.title}</div>
        {zone.artist && <div className="sonos-artist">{zone.artist}</div>}
        <div className="sonos-room">
          {zone.isPaused && <span className="sonos-paused-indicator">Paused · </span>}
          {getDisplayName(zone.roomName)}
        </div>
      </div>
    </div>
  );
}
