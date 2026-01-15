import { Clock } from '../widgets/Clock';
import { Calendar } from '../widgets/Calendar';
import { Weather } from '../widgets/Weather';
import { PhotoBackground } from '../widgets/PhotoBackground';
import { useWeather } from '../../hooks/useWeather';
import { useCalendar } from '../../hooks/useCalendar';
import { usePhotos } from '../../hooks/usePhotos';
import { config } from '../../config';

export function Dashboard() {
  const weather = useWeather(config.weather);
  const calendar = useCalendar(config.calendars);
  const photos = usePhotos(config.photos);

  return (
    <div className="dashboard">
      <PhotoBackground
        photos={photos.photos}
        rotateInterval={config.photos.rotateInterval}
        brightness={config.photos.brightness}
        blur={config.photos.blur}
        vignette={config.photos.vignette}
      />

      <div className="dashboard-content">
        <div className="dashboard-left">
          <div className="gradient-overlay left" />
          <Clock
            timezone={config.timezone}
            showSeconds={config.clock.showSeconds}
            showAmPm={config.clock.showAmPm}
          />
          <Calendar
            events={calendar.events}
            loading={calendar.loading}
            error={calendar.error}
            limit={config.calendar.limit}
          />
        </div>

        <div className="dashboard-right">
          <div className="gradient-overlay right" />
          <Weather
            data={weather.data}
            loading={weather.loading}
            error={weather.error}
            units={config.weather.units}
            daysToShow={config.weather.daysToShow}
            showFeelsLike={config.weather.showFeelsLike}
            showPrecipChance={config.weather.showPrecipChance}
          />
        </div>
      </div>
    </div>
  );
}
