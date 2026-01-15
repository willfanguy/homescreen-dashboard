export interface DashboardConfig {
  width: number;
  height: number;
  timezone: string;
  timeFormat: '12' | '24';
  fontFamily: string;
  backgroundColor: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string;
  calendarId: string;
}

export interface CalendarSource {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  icalUrl?: string;
  // For Google Calendar API (when iCal URL not available)
  googleCalendarId?: string;
}

export interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    condition: string;
    icon: string;
    weatherCode: number;
    humidity: number;
    windSpeed: number;
  };
  forecast: DayForecast[];
  alerts: WeatherAlert[];
}

export interface DayForecast {
  date: Date;
  high: number;
  low: number;
  condition: string;
  icon: string;
  weatherCode: number;
  precipChance: number;
}

export interface WeatherAlert {
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  start: Date;
  end: Date;
}

export interface PhotoSource {
  type: 'icloud' | 'local' | 'url';
  albumId?: string;
  albumUrl?: string;
  localPath?: string;
}

export interface Photo {
  url: string;
  width: number;
  height: number;
}
