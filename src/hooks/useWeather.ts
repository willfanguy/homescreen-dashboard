import { useState, useEffect } from 'react';
import type { WeatherData } from '../types/dashboard';

interface WeatherConfig {
  lat: number;
  lon: number;
  units: 'imperial' | 'metric';
}

interface UseWeatherResult {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Open-Meteo API - free, no API key required
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

export function useWeather(config: WeatherConfig): UseWeatherResult {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      const tempUnit = config.units === 'imperial' ? 'fahrenheit' : 'celsius';
      const windUnit = config.units === 'imperial' ? 'mph' : 'kmh';

      const params = new URLSearchParams({
        latitude: config.lat.toString(),
        longitude: config.lon.toString(),
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
        temperature_unit: tempUnit,
        wind_speed_unit: windUnit,
        timezone: 'auto',
        forecast_days: '7',
      });

      const response = await fetch(`${OPEN_METEO_BASE}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const json = await response.json();

      const weatherData: WeatherData = {
        current: {
          temp: json.current.temperature_2m,
          feelsLike: json.current.apparent_temperature,
          condition: getWeatherCondition(json.current.weather_code),
          icon: getWeatherIcon(json.current.weather_code),
          weatherCode: json.current.weather_code,
          humidity: json.current.relative_humidity_2m,
          windSpeed: json.current.wind_speed_10m,
          uvIndex: json.current.uv_index ?? 0,
        },
        forecast: json.daily.time.map((date: string, i: number) => ({
          date: new Date(date),
          high: json.daily.temperature_2m_max[i],
          low: json.daily.temperature_2m_min[i],
          condition: getWeatherCondition(json.daily.weather_code[i]),
          icon: getWeatherIcon(json.daily.weather_code[i]),
          weatherCode: json.daily.weather_code[i],
          precipChance: json.daily.precipitation_probability_max[i] || 0,
        })),
        alerts: [], // Open-Meteo doesn't provide alerts in free tier
        sunrise: new Date(json.daily.sunrise[0]),
        sunset: new Date(json.daily.sunset[0]),
      };

      setData(weatherData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();

    // Refresh weather every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [config.lat, config.lon, config.units]);

  return { data, loading, error, refetch: fetchWeather };
}

// WMO Weather interpretation codes
// https://open-meteo.com/en/docs
function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Heavy Drizzle',
    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',
    71: 'Light Snow',
    73: 'Snow',
    75: 'Heavy Snow',
    80: 'Rain Showers',
    81: 'Rain Showers',
    82: 'Heavy Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm',
    99: 'Severe Thunderstorm',
  };
  return conditions[code] || 'Unknown';
}

function getWeatherIcon(code: number): string {
  // Returns emoji for now - could be replaced with icon set
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌧️';
  if (code <= 65) return '🌧️';
  if (code <= 75) return '❄️';
  if (code <= 82) return '🌧️';
  if (code >= 95) return '⛈️';
  return '☁️';
}
