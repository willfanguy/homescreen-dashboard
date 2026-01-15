import type { WeatherData } from '../../types/dashboard';

interface WeatherProps {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  units?: 'imperial' | 'metric';
  daysToShow?: number;
  showFeelsLike?: boolean;
  showPrecipChance?: boolean;
}

export function Weather({
  data,
  loading,
  error,
  units = 'imperial',
  daysToShow = 5,
  showFeelsLike = true,
  showPrecipChance = true,
}: WeatherProps) {
  if (loading) {
    return <div className="weather-widget loading">Loading weather...</div>;
  }

  if (error) {
    return <div className="weather-widget error">{error}</div>;
  }

  if (!data) {
    return <div className="weather-widget">No weather data</div>;
  }

  const tempUnit = units === 'imperial' ? '°F' : '°C';

  return (
    <div className="weather-widget">
      <div className="weather-current">
        <div className="weather-temp">
          {Math.round(data.current.temp)}{tempUnit}
        </div>
        {showFeelsLike && (
          <div className="weather-feels-like">
            Feels like {Math.round(data.current.feelsLike)}{tempUnit}
          </div>
        )}
        <div className="weather-condition">{data.current.condition}</div>
      </div>

      <div className="weather-forecast">
        {data.forecast.slice(0, daysToShow).map((day, index) => (
          <div key={index} className="forecast-day">
            <div className="forecast-day-name">
              {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className="forecast-temps">
              <span className="forecast-high">{Math.round(day.high)}°</span>
              <span className="forecast-low">{Math.round(day.low)}°</span>
            </div>
            {showPrecipChance && day.precipChance > 0 && (
              <div className="forecast-precip">{day.precipChance}%</div>
            )}
          </div>
        ))}
      </div>

      {data.alerts.length > 0 && (
        <div className="weather-alerts">
          {data.alerts.map((alert, index) => (
            <div key={index} className={`weather-alert ${alert.severity}`}>
              {alert.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
