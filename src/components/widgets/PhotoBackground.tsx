import { useState, useEffect } from 'react';
import type { Photo } from '../../types/dashboard';

interface PhotoBackgroundProps {
  photos: Photo[];
  rotateInterval?: number;
  brightness?: number;
  blur?: boolean;
  vignette?: boolean;
}

interface SlotState {
  slotA: number;
  slotB: number;
  activeSlot: 'a' | 'b';
}

function PhotoLayer({ photo, opacity, blur }: { photo: Photo; opacity: number; blur: boolean }) {
  const isPortrait = photo.height > photo.width;
  return (
    <div className="photo-layer" style={{ opacity }}>
      <div
        className="photo-background-fill"
        style={{
          backgroundImage: `url(${photo.url})`,
          filter: isPortrait ? 'blur(30px)' : (blur ? 'blur(8px)' : 'none'),
          backgroundSize: 'cover',
          transform: isPortrait ? 'scale(1.1)' : 'none',
        }}
      />
      <div
        className="photo-background-main"
        style={{
          backgroundImage: `url(${photo.url})`,
          backgroundSize: isPortrait ? 'contain' : 'cover',
          filter: (!isPortrait && blur) ? 'blur(8px)' : 'none',
        }}
      />
    </div>
  );
}

export function PhotoBackground({
  photos,
  rotateInterval = 300,
  brightness = 0.3,
  blur = true,
  vignette = true,
}: PhotoBackgroundProps) {
  const [{ slotA, slotB, activeSlot }, setState] = useState<SlotState>({
    slotA: 0,
    slotB: 0,
    activeSlot: 'a',
  });

  useEffect(() => {
    if (photos.length <= 1) return;

    const interval = setInterval(() => {
      setState(prev => {
        const currentIndex = prev.activeSlot === 'a' ? prev.slotA : prev.slotB;
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * photos.length);
        } while (nextIndex === currentIndex);

        if (prev.activeSlot === 'a') {
          return { slotA: prev.slotA, slotB: nextIndex, activeSlot: 'b' };
        } else {
          return { slotA: nextIndex, slotB: prev.slotB, activeSlot: 'a' };
        }
      });
    }, rotateInterval * 1000);

    return () => clearInterval(interval);
  }, [photos.length, rotateInterval]);

  if (photos.length === 0) {
    return <div className="photo-background empty" />;
  }

  const photoA = photos[Math.min(slotA, photos.length - 1)];
  const photoB = photos[Math.min(slotB, photos.length - 1)];

  return (
    <div className="photo-background">
      <PhotoLayer photo={photoA} opacity={activeSlot === 'a' ? 1 : 0} blur={blur} />
      <PhotoLayer photo={photoB} opacity={activeSlot === 'b' ? 1 : 0} blur={blur} />
      <div
        className="photo-overlay"
        style={{ backgroundColor: `rgba(0, 0, 0, ${1 - brightness})` }}
      />
      {vignette && <div className="photo-vignette" />}
    </div>
  );
}
