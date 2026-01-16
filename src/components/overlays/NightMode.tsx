import { useState, useEffect, useMemo } from 'react';
import { WeatherIcon } from '../widgets/WeatherIcon';
import type { CalendarEvent, WeatherData } from '../../types/dashboard';

interface NightModeProps {
  enabled: boolean;
  startHour: number;
  endHour: number;
  timezone: string;
  weather: WeatherData | null;
  events: CalendarEvent[];
}

export function NightMode({
  enabled,
  startHour,
  endHour,
  timezone,
  weather,
  events,
}: NightModeProps) {
  const [now, setNow] = useState(() => new Date());
  const [isVisible, setIsVisible] = useState(false);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Check if we're in night mode hours
  const isNightTime = useMemo(() => {
    if (!enabled) return false;

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });

    const hour = parseInt(formatter.format(now), 10);

    // Handle overnight range (e.g., 23:00 to 06:00)
    if (startHour > endHour) {
      return hour >= startHour || hour < endHour;
    }
    // Handle same-day range (e.g., 01:00 to 05:00)
    return hour >= startHour && hour < endHour;
  }, [now, enabled, startHour, endHour, timezone]);

  // Smooth transition
  useEffect(() => {
    setIsVisible(isNightTime);
  }, [isNightTime]);

  // Format time
  const formatTime = () => {
    return now.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format date
  const formatDate = () => {
    return now.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  // Find next day's first event
  const nextDayFirstEvent = useMemo(() => {
    // Get start of tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Get end of tomorrow
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    return events
      .filter(event => !event.allDay)
      .filter(event => event.start >= tomorrow && event.start <= endOfTomorrow)
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0] || null;
  }, [events, now]);

  // Format event time
  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`night-mode-overlay ${isVisible ? 'visible' : ''}`}>
      <div className="night-mode-content">
        <div className="night-clock">
          <div className="night-time">{formatTime()}</div>
          <div className="night-date">{formatDate()}</div>
        </div>

        {nextDayFirstEvent && (
          <div className="night-next-event">
            <span className="night-event-time">{formatEventTime(nextDayFirstEvent.start)}</span>
            <span className="night-event-title">{nextDayFirstEvent.title}</span>
          </div>
        )}

        {weather && (
          <div className="night-weather">
            <WeatherIcon code={weather.current.weatherCode} size={32} className="night-weather-icon" />
            <span className="night-temp">{Math.round(weather.current.temp)}°</span>
          </div>
        )}
      </div>
    </div>
  );
}
