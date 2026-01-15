import { useState, useEffect } from 'react';
import type { Photo } from '../../types/dashboard';

interface PhotoBackgroundProps {
  photos: Photo[];
  rotateInterval?: number; // seconds
  brightness?: number; // 0-1
  blur?: boolean;
  vignette?: boolean;
  useTransitions?: boolean;
}

export function PhotoBackground({
  photos,
  rotateInterval = 300,
  brightness = 0.3,
  blur = true,
  vignette = true,
  useTransitions = true,
}: PhotoBackgroundProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (photos.length <= 1) return;

    const getRandomIndex = (current: number, total: number) => {
      if (total <= 1) return 0;
      let next;
      do {
        next = Math.floor(Math.random() * total);
      } while (next === current);
      return next;
    };

    const interval = setInterval(() => {
      if (useTransitions) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentIndex(prev => getRandomIndex(prev, photos.length));
          setIsTransitioning(false);
        }, 500);
      } else {
        setCurrentIndex(prev => getRandomIndex(prev, photos.length));
      }
    }, rotateInterval * 1000);

    return () => clearInterval(interval);
  }, [photos.length, rotateInterval, useTransitions]);

  if (photos.length === 0) {
    return <div className="photo-background empty" />;
  }

  // Ensure index is within bounds (photos array may have changed)
  const safeIndex = currentIndex < photos.length ? currentIndex : 0;
  const currentPhoto = photos[safeIndex];
  const isPortrait = currentPhoto.height > currentPhoto.width;

  return (
    <div className={`photo-background ${isTransitioning ? 'transitioning' : ''}`}>
      {/* Blurred background fill layer */}
      <div
        className="photo-background-fill"
        style={{
          backgroundImage: `url(${currentPhoto.url})`,
          filter: isPortrait ? 'blur(30px)' : (blur ? 'blur(8px)' : 'none'),
          backgroundSize: 'cover',
          transform: isPortrait ? 'scale(1.1)' : 'none',
        }}
      />
      {/* Main image layer */}
      <div
        className="photo-background-main"
        style={{
          backgroundImage: `url(${currentPhoto.url})`,
          backgroundSize: isPortrait ? 'contain' : 'cover',
          filter: (!isPortrait && blur) ? 'blur(8px)' : 'none',
        }}
      />
      <div
        className="photo-overlay"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${1 - brightness})`,
        }}
      />
      {vignette && <div className="photo-vignette" />}
    </div>
  );
}
