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
    limit: 3,
  },

  // Calendar sources via iCal URLs (from work Google account)
  // To get URL: Google Calendar > Settings > [Calendar] > "Secret address in iCal format"
  calendars: [
    {
      id: 'work',
      name: 'Work',
      color: '#039be5',
      enabled: true,
      icalUrl: '', // TODO: Add work calendar iCal URL
    },
    {
      id: 'personal',
      name: 'Personal',
      color: '#3f51b5',
      enabled: true,
      icalUrl: '', // TODO: Add personal calendar iCal URL (from work account view)
    },
    {
      id: 'shared',
      name: 'W+L',
      color: '#009688',
      enabled: true,
      icalUrl: '', // TODO: Add shared calendar iCal URL
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
  // Album token from shared album URL: icloud.com/sharedalbum/#B0n5ON9t3syvwZ
  photos: {
    albumToken: 'B0n5ON9t3syvwZ',
    rotateInterval: 300, // 5 minutes
    brightness: 0.6,
    blur: false,
    vignette: true,
  },
};
