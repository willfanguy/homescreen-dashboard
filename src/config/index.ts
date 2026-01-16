import type { CalendarSource } from '../types/dashboard';

export interface AppConfig {
  timezone: string;
  clock: {
    showSeconds: boolean;
    showAmPm: boolean;
    use24Hour: boolean;
  };
  calendar: {
    limit: number;
  };
  workday: {
    startHour: number; // 0-23, e.g., 9 for 9 AM
    endHour: number;   // 0-23, e.g., 17 for 5 PM
    showOnWeekends: boolean;
  };
  nightMode: {
    startHour: number; // 0-23, e.g., 23 for 11 PM
    endHour: number;   // 0-23, e.g., 6 for 6 AM
    enabled: boolean;
  };
  sonos: {
    // Map Sonos speaker/zone names to display names
    // Key: Sonos zone name, Value: display name
    roomNames: Record<string, string>;
  };
  // Calendar sources use iCal URLs - can be from any Google account
  // Work account already has personal calendars merged
  calendars: CalendarSource[];
  weather: {
    lat: number;
    lon: number;
    units: 'imperial' | 'metric';
    daysToShow: number;
    showFeelsLike: boolean;
    showPrecipChance: boolean;
  };
  // iCloud Shared Album config
  // Album token is the ID from the shared album URL: icloud.com/sharedalbum/#<token>
  photos: {
    albumToken: string;
    rotateInterval: number;
    brightness: number;
    blur: boolean;
    vignette: boolean;
  };
}

export const config: AppConfig = {
  timezone: 'America/Chicago',

  clock: {
    showSeconds: true,
    showAmPm: true,
    use24Hour: false,
  },

  calendar: {
    limit: 15,
  },

  workday: {
    startHour: 8,  // 8 AM
    endHour: 18,   // 6 PM
    showOnWeekends: false,
  },

  nightMode: {
    startHour: 23, // 11 PM
    endHour: 6,    // 6 AM
    enabled: true,
  },

  sonos: {
    // Map Sonos zone names to friendly room names
    roomNames: {
      'One': 'Office',
      'Roam': 'Kitchen',
      'Sonos Arc': 'Living Room',
      'Bedroom': 'Bedroom',
      'Era 100': 'Record Player',
    },
  },

  // Calendar sources - mix of iCal URLs and Google Calendar API
  calendars: [
    {
      id: 'work',
      name: 'Work',
      color: '#003a9b',
      enabled: true,
      googleCalendarId: 'wfanguy@contractor.indeed.com',
    },
    {
      id: 'personal',
      name: 'Personal',
      color: '#3f51b5',
      enabled: true,
      icalUrl: 'https://calendar.google.com/calendar/ical/will.fanguy%40gmail.com/private-1ba3cb07f1879b90fb537e2b07c456bf/basic.ics',
    },
    {
      id: 'shared',
      name: 'W+L',
      color: '#009688',
      enabled: true,
      icalUrl: 'https://calendar.google.com/calendar/ical/henvmd02vmfsaeclloepv1fj8c%40group.calendar.google.com/private-d3725444ad9c88d486a9ad5c2064591b/basic.ics',
    },
    {
      id: 'trash',
      name: 'Trash & Recycling',
      color: '#795548',
      enabled: true,
      icalUrl: 'https://recollect.a.ssl.fastly.net/api/places/98FC9CCA-5910-11E8-B1B1-B8DF4FF8365D/services/323/events.en-US.ics?client_id=1049768E-DF21-11EF-9183-CFFC2C1B26CC',
    },
  ],

  weather: {
    // Austin, TX
    lat: 30.360884,
    lon: -97.651821,
    units: 'imperial',
    daysToShow: 7,
    showFeelsLike: true,
    showPrecipChance: true,
  },

  // iCloud Shared Album
  // Album token from shared album URL: icloud.com/sharedalbum/#B0n5ON9t3syvwZ
  photos: {
    albumToken: 'B0n5ON9t3syvwZ',
    rotateInterval: 300, // 5 minutes
    brightness: 0.5, // lower = darker overlay
    blur: false,
    vignette: true,
  },
};
