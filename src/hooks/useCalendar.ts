import { useState, useEffect } from 'react';
import type { CalendarEvent, CalendarSource } from '../types/dashboard';

interface UseCalendarResult {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCalendar(sources: CalendarSource[]): UseCalendarResult {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendars = async () => {
    setLoading(true);
    setError(null);

    try {
      const enabledSources = sources.filter(s => s.enabled && (s.icalUrl || s.googleCalendarId));

      if (enabledSources.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const allEvents: CalendarEvent[] = [];

      for (const source of enabledSources) {
        try {
          if (source.icalUrl) {
            // Use backend proxy for iCal feeds
            const proxyUrl = `/api/calendar/ical?url=${encodeURIComponent(source.icalUrl)}`;
            const response = await fetch(proxyUrl);
            const icalText = await response.text();
            const parsed = parseICalEvents(icalText, source);
            allEvents.push(...parsed);
          } else if (source.googleCalendarId) {
            // Use Google Calendar API
            const response = await fetch(
              `/api/calendar/google/events/${encodeURIComponent(source.googleCalendarId)}`
            );
            if (response.ok) {
              const events = await response.json();
              const parsed = events.map((e: any) => ({
                id: e.id,
                title: e.summary,
                start: new Date(e.start),
                end: new Date(e.end),
                allDay: e.allDay,
                color: source.color,
                calendarId: source.id,
              }));
              allEvents.push(...parsed);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch calendar ${source.name}:`, err);
        }
      }

      // Sort by start time
      allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
      setEvents(allEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendars();

    // Refresh every 5 minutes
    const interval = setInterval(fetchCalendars, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [sources]);

  return { events, loading, error, refetch: fetchCalendars };
}

// Basic iCal parser - handles common cases
function parseICalEvents(icalText: string, source: CalendarSource): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icalText.split(/\r?\n/);

  let currentEvent: Partial<CalendarEvent> | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle line folding (lines starting with space/tab are continuations)
    while (i + 1 < lines.length && /^[ \t]/.test(lines[i + 1])) {
      line += lines[++i].substring(1);
    }

    if (line === 'BEGIN:VEVENT') {
      currentEvent = {
        calendarId: source.id,
        color: source.color,
      };
    } else if (line === 'END:VEVENT' && currentEvent) {
      // For all-day events without DTEND, default end to start date
      if (currentEvent.start && !currentEvent.end && currentEvent.allDay) {
        currentEvent.end = currentEvent.start;
      }
      if (currentEvent.id && currentEvent.title && currentEvent.start && currentEvent.end) {
        events.push(currentEvent as CalendarEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':');

      if (key === 'UID') {
        currentEvent.id = value;
      } else if (key === 'SUMMARY') {
        currentEvent.title = decodeICalText(value);
      } else if (key.startsWith('DTSTART')) {
        currentEvent.start = parseICalDate(value);
        currentEvent.allDay = !key.includes('VALUE=DATE-TIME') && value.length === 8;
      } else if (key.startsWith('DTEND')) {
        currentEvent.end = parseICalDate(value);
      }
    }
  }

  return events;
}

function parseICalDate(value: string): Date {
  // Handle formats: 20240115, 20240115T120000, 20240115T120000Z
  if (value.length === 8) {
    // Date only: YYYYMMDD
    const year = parseInt(value.substring(0, 4));
    const month = parseInt(value.substring(4, 6)) - 1;
    const day = parseInt(value.substring(6, 8));
    return new Date(year, month, day);
  }

  // DateTime: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const year = parseInt(value.substring(0, 4));
  const month = parseInt(value.substring(4, 6)) - 1;
  const day = parseInt(value.substring(6, 8));
  const hour = parseInt(value.substring(9, 11));
  const minute = parseInt(value.substring(11, 13));
  const second = parseInt(value.substring(13, 15)) || 0;

  if (value.endsWith('Z')) {
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  return new Date(year, month, day, hour, minute, second);
}

function decodeICalText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}
