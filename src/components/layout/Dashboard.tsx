import { useState, useEffect, useMemo } from 'react';
import { Clock } from '../widgets/Clock';
import { Calendar } from '../widgets/Calendar';
import { Weather } from '../widgets/Weather';
import { PhotoBackground } from '../widgets/PhotoBackground';
import { TrashReminder } from '../widgets/TrashReminder';
import { NextEventCountdown } from '../widgets/NextEventCountdown';
import { useWeather } from '../../hooks/useWeather';
import { useCalendar } from '../../hooks/useCalendar';
import { usePhotos } from '../../hooks/usePhotos';
import { useAirQuality } from '../../hooks/useAirQuality';
import { useNWSAlerts } from '../../hooks/useNWSAlerts';
import { getMoonPhase, type MoonPhaseData } from '../../utils/moonPhase';
import { config } from '../../config';
import type { CalendarEvent, WeatherAlert } from '../../types/dashboard';

// Toggle test data via URL param: ?testData=true or ?testCountdown=true
const SHOW_TEST_DATA = new URLSearchParams(window.location.search).get('testData') === 'true';
const SHOW_TEST_COUNTDOWN = new URLSearchParams(window.location.search).get('testCountdown') === 'true';

export function Dashboard() {
  const weather = useWeather(config.weather);
  const calendar = useCalendar(config.calendars);
  const photos = usePhotos({ albumToken: config.photos.albumToken });
  const airQuality = useAirQuality({ lat: config.weather.lat, lon: config.weather.lon });
  const nwsAlerts = useNWSAlerts({ lat: config.weather.lat, lon: config.weather.lon });
  const [moonPhase, setMoonPhase] = useState<MoonPhaseData>(() => getMoonPhase());

  // Update moon phase at midnight
  useEffect(() => {
    const updateMoon = () => setMoonPhase(getMoonPhase());
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const timeoutId = setTimeout(() => {
      updateMoon();
      intervalId = setInterval(updateMoon, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Test data for development
  const testTrashEvents: CalendarEvent[] = useMemo(() => {
    if (!SHOW_TEST_DATA) return [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return [{
      id: 'test-trash',
      title: 'Recycling, trash, and composting',
      start: tomorrow,
      end: tomorrow,
      allDay: true,
      color: '#795548',
      calendarId: 'trash',
    }];
  }, []);

  const testAlerts: WeatherAlert[] = useMemo(() => {
    if (!SHOW_TEST_DATA) return [];
    const now = new Date();
    const later = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    return [{
      title: 'Severe Thunderstorm Warning',
      description: 'Severe thunderstorms expected with damaging winds and large hail.',
      severity: 'severe',
      start: now,
      end: later,
    }];
  }, []);

  // Test event for countdown: starts 10 minutes from now
  const testCountdownEvents: CalendarEvent[] = useMemo(() => {
    if (!SHOW_TEST_COUNTDOWN) return [];
    const now = new Date();
    const eventStart = new Date(now.getTime() + 10 * 60 * 1000);
    const eventEnd = new Date(eventStart.getTime() + 30 * 60 * 1000);
    return [{
      id: 'test-countdown',
      title: 'Test Meeting - Watch the colors change!',
      start: eventStart,
      end: eventEnd,
      allDay: false,
      color: '#4285f4',
      calendarId: 'test',
    }];
  }, []);

  // Merge test data
  const allTrashEvents = SHOW_TEST_DATA ? [...calendar.events, ...testTrashEvents] : calendar.events;
  const countdownEvents = SHOW_TEST_COUNTDOWN ? [...calendar.events, ...testCountdownEvents] : calendar.events;
  const weatherWithAlerts = useMemo(() => {
    if (!weather.data) return weather.data;

    // Combine NWS alerts with any test alerts
    const allAlerts = [
      ...nwsAlerts.alerts,
      ...(SHOW_TEST_DATA ? testAlerts : []),
    ];

    return {
      ...weather.data,
      alerts: allAlerts,
    };
  }, [weather.data, nwsAlerts.alerts, testAlerts]);

  return (
    <div className="dashboard">
      <PhotoBackground
        photos={photos.photos}
        rotateInterval={config.photos.rotateInterval}
        brightness={config.photos.brightness}
        blur={config.photos.blur}
        vignette={config.photos.vignette}
      />

      {photos.error && (
        <div className="auth-prompt">
          <p>Photo error: {photos.error}</p>
        </div>
      )}

      <div className="dashboard-content">
        <div className="dashboard-top-center">
          <NextEventCountdown
            events={countdownEvents}
            maxHoursAhead={3}
            excludeCalendarIds={['trash']}
          />
        </div>

        <div className="dashboard-left">
          <div className="gradient-overlay left" />
          <Clock
            timezone={config.timezone}
            showSeconds={config.clock.showSeconds}
            showAmPm={config.clock.showAmPm}
            use24Hour={config.clock.use24Hour}
          />
          <Calendar
            events={calendar.events}
            loading={calendar.loading}
            error={calendar.error}
            limit={config.calendar.limit}
            excludeCalendarIds={['trash']}
          />
        </div>

        <div className="dashboard-right">
          <div className="gradient-overlay right" />
          <Weather
            data={weatherWithAlerts}
            loading={weather.loading}
            error={weather.error}
            units={config.weather.units}
            daysToShow={config.weather.daysToShow}
            showFeelsLike={config.weather.showFeelsLike}
            showPrecipChance={config.weather.showPrecipChance}
            airQuality={airQuality.data}
            moonPhase={moonPhase}
          />
          <div className="dashboard-right-bottom">
            <TrashReminder events={allTrashEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}
