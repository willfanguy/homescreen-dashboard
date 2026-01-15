import type { CalendarEvent } from '../../types/dashboard';

interface CalendarProps {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  limit?: number;
  showEndTime?: boolean;
  dateFormat?: string;
}

export function Calendar({
  events,
  loading,
  error,
  limit = 3,
  showEndTime = false,
}: CalendarProps) {
  if (loading) {
    return <div className="calendar-widget loading">Loading calendar...</div>;
  }

  if (error) {
    return <div className="calendar-widget error">{error}</div>;
  }

  const upcomingEvents = events
    .filter(event => event.start >= new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, limit);

  const groupedByDay = upcomingEvents.reduce((groups, event) => {
    const dateKey = event.start.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {} as Record<string, CalendarEvent[]>);

  const formatEventTime = (event: CalendarEvent) => {
    if (event.allDay) return 'All day';

    const startTime = event.start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    if (showEndTime) {
      const endTime = event.end.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      return `${startTime} - ${endTime}`;
    }

    return startTime;
  };

  const formatDayHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="calendar-widget">
      {Object.entries(groupedByDay).map(([dateKey, dayEvents]) => (
        <div key={dateKey} className="calendar-day">
          <div className="calendar-day-header">{formatDayHeader(dateKey)}</div>
          {dayEvents.map(event => (
            <div
              key={event.id}
              className="calendar-event"
              style={{ borderLeftColor: event.color }}
            >
              <div className="event-time">{formatEventTime(event)}</div>
              <div className="event-title">{event.title}</div>
            </div>
          ))}
        </div>
      ))}
      {upcomingEvents.length === 0 && (
        <div className="calendar-empty">No upcoming events</div>
      )}
    </div>
  );
}
