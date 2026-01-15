import type { CalendarEvent } from '../../types/dashboard';

interface TrashReminderProps {
  events: CalendarEvent[];
}

interface PickupInfo {
  date: Date;
  types: string[];
  title: string;
}

export function TrashReminder({ events }: TrashReminderProps) {
  const nextPickup = getNextPickup(events);

  if (!nextPickup) {
    return null;
  }

  const daysUntil = getDaysUntil(nextPickup.date);
  const dayLabel = getDayLabel(daysUntil, nextPickup.date);

  return (
    <div className="trash-reminder">
      <div className="trash-header">
        <span className="trash-icon">▣</span>
        <span className="trash-day">{dayLabel}</span>
      </div>
      <div className="trash-types">
        {nextPickup.types.map((type) => (
          <span key={type} className={`trash-type ${type.toLowerCase()}`}>
            {getTypeIcon(type)} {type}
          </span>
        ))}
      </div>
    </div>
  );
}

function getNextPickup(events: CalendarEvent[]): PickupInfo | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Find events that look like trash/recycling pickups
  const pickupEvents = events.filter((event) => {
    const title = event.title.toLowerCase();
    return (
      title.includes('trash') ||
      title.includes('recycl') ||
      title.includes('compost') ||
      title.includes('garbage') ||
      title.includes('waste') ||
      title.includes('collection')
    );
  });

  // Get the next upcoming pickup (today or future)
  const upcoming = pickupEvents
    .filter((event) => {
      const eventDate = new Date(event.start);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= now;
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (upcoming.length === 0) {
    return null;
  }

  const nextEvent = upcoming[0];
  const types = parsePickupTypes(nextEvent.title);

  return {
    date: nextEvent.start,
    types,
    title: nextEvent.title,
  };
}

function parsePickupTypes(title: string): string[] {
  const types: string[] = [];
  const lower = title.toLowerCase();

  if (lower.includes('recycl')) {
    types.push('Recycling');
  }
  if (lower.includes('trash') || lower.includes('garbage')) {
    types.push('Trash');
  }
  if (lower.includes('compost')) {
    types.push('Compost');
  }
  if (lower.includes('yard') || lower.includes('brush')) {
    types.push('Yard Waste');
  }

  // If we couldn't parse specific types, just show "Pickup"
  if (types.length === 0) {
    types.push('Pickup');
  }

  return types;
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDayLabel(daysUntil: number, date: Date): string {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  if (daysUntil < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getTypeIcon(type: string): string {
  switch (type.toLowerCase()) {
    case 'recycling':
      return '♻';
    case 'trash':
      return '▪';
    case 'compost':
      return '◉';
    case 'yard waste':
      return '❧';
    default:
      return '•';
  }
}
