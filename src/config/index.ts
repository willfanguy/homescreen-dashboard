import type { CalendarSource, PhotoSource } from '../types/dashboard';

export interface AppConfig {
  timezone: string;
  clock: {
    showSeconds: boolean;
    showAmPm: boolean;
  };
  calendar: {
    limit: number;
    sources: CalendarSource[];
  };
  calendars: CalendarSource[];
  weather: {
    lat: number;
    lon: number;
    units: 'imperial' | 'metric';
    daysToShow: number;
    showFeelsLike: boolean;
    showPrecipChance: boolean;
  };
  photos: PhotoSource & {
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
    showAmPm: false,
  },

  calendar: {
    limit: 3,
    sources: [],
  },

  // Calendar sources - add your iCal URLs here
  calendars: [
    {
      id: 'personal',
      name: 'Personal',
      color: '#3f51b5',
      enabled: true,
      // To get iCal URL: Google Calendar > Settings > Calendar > Secret address in iCal format
      icalUrl: '', // TODO: Add your calendar URL
    },
    {
      id: 'shared',
      name: 'Shared',
      color: '#009688',
      enabled: true,
      icalUrl: '', // TODO: Add your calendar URL
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

  photos: {
    type: 'icloud',
    albumId: 'B0n5ON9t3syvwZ',
    albumUrl: 'https://www.icloud.com/sharedalbum/#B0n5ON9t3syvwZ',
    rotateInterval: 300, // 5 minutes
    brightness: 0.3,
    blur: true,
    vignette: true,
  },
};
