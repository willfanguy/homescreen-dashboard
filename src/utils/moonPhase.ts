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
  // Tighter thresholds: New/Full Moon ~1 day window, other phases evenly distributed
  if (phase < 0.034) return 'New Moon';
  if (phase < 0.178) return 'Waxing Crescent';
  if (phase < 0.322) return 'First Quarter';
  if (phase < 0.466) return 'Waxing Gibbous';
  if (phase < 0.534) return 'Full Moon';
  if (phase < 0.678) return 'Waning Gibbous';
  if (phase < 0.822) return 'Last Quarter';
  if (phase < 0.966) return 'Waning Crescent';
  return 'New Moon';
}

function getPhaseEmoji(phase: number): string {
  if (phase < 0.034) return '🌑';
  if (phase < 0.178) return '🌒';
  if (phase < 0.322) return '🌓';
  if (phase < 0.466) return '🌔';
  if (phase < 0.534) return '🌕';
  if (phase < 0.678) return '🌖';
  if (phase < 0.822) return '🌗';
  if (phase < 0.966) return '🌘';
  return '🌑';
}

function getIllumination(phase: number): number {
  // Illumination follows a cosine curve
  // 0% at new moon (phase=0), 100% at full moon (phase=0.5)
  return Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
}
