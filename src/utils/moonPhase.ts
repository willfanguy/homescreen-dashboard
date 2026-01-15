export interface MoonPhaseData {
  phase: number; // 0-1 where 0 = new moon, 0.5 = full moon
  name: string;
  emoji: string;
  illumination: number; // 0-100%
}

/**
 * Calculate the moon phase for a given date.
 * Uses a simplified algorithm based on the synodic month (29.53 days).
 */
export function getMoonPhase(date: Date = new Date()): MoonPhaseData {
  // Known new moon reference: January 6, 2000 at 18:14 UTC
  const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  const synodicMonth = 29.53058867; // Average length of synodic month in days

  const daysSinceKnown = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const lunarCycles = daysSinceKnown / synodicMonth;
  const phase = lunarCycles - Math.floor(lunarCycles); // 0-1

  return {
    phase,
    name: getPhaseName(phase),
    emoji: getPhaseEmoji(phase),
    illumination: getIllumination(phase),
  };
}

function getPhaseName(phase: number): string {
  if (phase < 0.0625) return 'New Moon';
  if (phase < 0.1875) return 'Waxing Crescent';
  if (phase < 0.3125) return 'First Quarter';
  if (phase < 0.4375) return 'Waxing Gibbous';
  if (phase < 0.5625) return 'Full Moon';
  if (phase < 0.6875) return 'Waning Gibbous';
  if (phase < 0.8125) return 'Last Quarter';
  if (phase < 0.9375) return 'Waning Crescent';
  return 'New Moon';
}

function getPhaseEmoji(phase: number): string {
  if (phase < 0.0625) return '🌑';
  if (phase < 0.1875) return '🌒';
  if (phase < 0.3125) return '🌓';
  if (phase < 0.4375) return '🌔';
  if (phase < 0.5625) return '🌕';
  if (phase < 0.6875) return '🌖';
  if (phase < 0.8125) return '🌗';
  if (phase < 0.9375) return '🌘';
  return '🌑';
}

function getIllumination(phase: number): number {
  // Illumination follows a cosine curve
  // 0% at new moon (phase=0), 100% at full moon (phase=0.5)
  return Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
}
