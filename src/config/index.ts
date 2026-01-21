import type { CalendarSource } from '../types/dashboard';

// Environment variables (from .env.local)
// These contain secrets and should not be committed to the repo
const env = {
  icalUrlPersonal: import.meta.env.VITE_ICAL_URL_PERSONAL || '',
  icalUrlShared: import.meta.env.VITE_ICAL_URL_SHARED || '',
  icalUrlTrash: import.meta.env.VITE_ICAL_URL_TRASH || '',
  googleCalendarId: import.meta.env.VITE_GOOGLE_CALENDAR_ID || '',
  icloudAlbumToken: import.meta.env.VITE_ICLOUD_ALBUM_TOKEN || '',
};

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
  // Sensitive URLs are loaded from environment variables (see .env.example)
  calendars: [
    {
      id: 'work',
      name: 'Work',
      color: '#003a9b',
      enabled: !!env.googleCalendarId,
      googleCalendarId: env.googleCalendarId,
    },
    {
      id: 'personal',
      name: 'Personal',
      color: '#3f51b5',
      enabled: !!env.icalUrlPersonal,
      icalUrl: env.icalUrlPersonal,
    },
    {
      id: 'shared',
      name: 'W+L',
      color: '#009688',
      enabled: !!env.icalUrlShared,
      icalUrl: env.icalUrlShared,
    },
    {
      id: 'trash',
      name: 'Trash & Recycling',
      color: '#795548',
      enabled: !!env.icalUrlTrash,
      icalUrl: env.icalUrlTrash,
    },
  ],

  weather: {
    // Austin, TX
    lat: 30.360884,
    lon: -97.651821,
    units: 'imperial',
    daysToShow: 5,
    showFeelsLike: true,
    showPrecipChance: true,
  },

  // iCloud Shared Album
  // Album token from shared album URL: icloud.com/sharedalbum/#<token>
  // Token is loaded from environment variable (see .env.example)
  photos: {
    albumToken: env.icloudAlbumToken,
    rotateInterval: 300, // 5 minutes
    brightness: 0.5, // lower = darker overlay
    blur: false,
    vignette: true,
  },
};
