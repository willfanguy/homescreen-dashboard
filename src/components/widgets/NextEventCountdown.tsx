import { useState, useEffect, useMemo } from 'react';
import type { CalendarEvent } from '../../types/dashboard';

interface NextEventCountdownProps {
  events: CalendarEvent[];
  maxHoursAhead?: number;
  excludeCalendarIds?: string[];
}

export function NextEventCountdown({
  events,
  maxHoursAhead = 3,
  excludeCalendarIds = [],
}: NextEventCountdownProps) {
  const [now, setNow] = useState(() => new Date());

  // Find the next upcoming non-all-day event
  const nextEvent = useMemo(() => {
    const maxTime = now.getTime() + maxHoursAhead * 60 * 60 * 1000;

    return events
      .filter(event => !event.allDay)
      .filter(event => !excludeCalendarIds.includes(event.calendarId))
      .filter(event => event.start.getTime() > now.getTime())
      .filter(event => event.start.getTime() <= maxTime)
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0] || null;
  }, [events, now, maxHoursAhead, excludeCalendarIds]);

  // Calculate time remaining
  const timeRemaining = useMemo(() => {
    if (!nextEvent) return null;

    const diff = nextEvent.start.getTime() - now.getTime();
    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const seconds = Math.floor((diff % 60000) / 1000);

    return { hours, minutes, seconds, totalMinutes };
  }, [nextEvent, now]);

  // Determine urgency level
  const urgency = useMemo(() => {
    if (!timeRemaining) return 'none';
    if (timeRemaining.totalMinutes < 5) return 'critical';
    if (timeRemaining.totalMinutes < 15) return 'warning';
    return 'normal';
  }, [timeRemaining]);

  // Update interval: every second when < 15 min, every minute otherwise
  useEffect(() => {
    const intervalMs = urgency === 'normal' ? 60000 : 1000;
    const interval = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(interval);
  }, [urgency]);

  // Don't render if no upcoming event within threshold
  if (!nextEvent || !timeRemaining) {
    return null;
  }

  // Format the countdown display
  const formatCountdown = () => {
    const { hours, minutes, seconds } = timeRemaining;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes >= 5) {
      return `${minutes}m`;
    }
    // Show seconds when < 5 minutes
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format the event time
  const formatEventTime = () => {
    return nextEvent.start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className={`next-event-countdown urgency-${urgency}`}>
      <div className="countdown-time">{formatCountdown()}</div>
      <div className="countdown-label">until</div>
      <div className="countdown-event-title">{nextEvent.title}</div>
      <div className="countdown-event-time">at {formatEventTime()}</div>
    </div>
  );
}
