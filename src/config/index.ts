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
    brightness: 0.6,
    blur: false,
    vignette: true,
  },
};
