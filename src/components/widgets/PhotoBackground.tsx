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

    const interval = setInterval(() => {
      if (useTransitions) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentIndex(prev => (prev + 1) % photos.length);
          setIsTransitioning(false);
        }, 500);
      } else {
        setCurrentIndex(prev => (prev + 1) % photos.length);
      }
    }, rotateInterval * 1000);

    return () => clearInterval(interval);
  }, [photos.length, rotateInterval, useTransitions]);

  if (photos.length === 0) {
    return <div className="photo-background empty" />;
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div
      className={`photo-background ${isTransitioning ? 'transitioning' : ''}`}
      style={{
        backgroundImage: `url(${currentPhoto.url})`,
        filter: blur ? 'blur(8px)' : 'none',
      }}
    >
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
