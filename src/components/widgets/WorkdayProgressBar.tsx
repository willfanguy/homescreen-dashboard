import { useState, useEffect, useMemo } from 'react';

interface WorkdayProgressBarProps {
  startHour: number;
  endHour: number;
  showOnWeekends?: boolean;
  timezone?: string;
}

export function WorkdayProgressBar({
  startHour,
  endHour,
  showOnWeekends = false,
  timezone,
}: WorkdayProgressBarProps) {
  const [now, setNow] = useState(() => new Date());

  // Update every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate progress and visibility
  const { percentage, isVisible } = useMemo(() => {
    // Get current time in the specified timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short',
    });

    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const weekday = parts.find(p => p.type === 'weekday')?.value || '';

    // Check if it's a weekend
    const isWeekend = weekday === 'Sat' || weekday === 'Sun';
    if (isWeekend && !showOnWeekends) {
      return { percentage: 0, isVisible: false };
    }

    // Calculate current time in minutes from midnight
    const currentMinutes = hour * 60 + minute;
    const startMinutes = startHour * 60;
    const endMinutes = endHour * 60;

    // Before workday
    if (currentMinutes < startMinutes) {
      return { percentage: 0, isVisible: false };
    }

    // After workday
    if (currentMinutes >= endMinutes) {
      return { percentage: 100, isVisible: false };
    }

    // During workday
    const totalWorkMinutes = endMinutes - startMinutes;
    const elapsedMinutes = currentMinutes - startMinutes;
    const pct = (elapsedMinutes / totalWorkMinutes) * 100;

    return { percentage: Math.min(100, Math.max(0, pct)), isVisible: true };
  }, [now, startHour, endHour, showOnWeekends, timezone]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="workday-progress-bar">
      <div
        className="workday-progress-fill"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
