import { useHomebridge, celsiusToFahrenheit, type TemperatureSensor } from '../../hooks/useHomebridge';

interface SensorBarProps {
  refreshInterval?: number;
  useFahrenheit?: boolean;
  // Optional: specify which sensors to show (by name). If empty, shows all.
  sensorNames?: string[];
}

// Temperature comfort ranges (Fahrenheit)
function getTemperatureState(tempF: number): 'cold' | 'cool' | 'comfortable' | 'warm' | 'hot' {
  if (tempF < 65) return 'cold';
  if (tempF < 68) return 'cool';
  if (tempF <= 74) return 'comfortable';
  if (tempF <= 78) return 'warm';
  return 'hot';
}

// Short display name for sensors
function getShortName(name: string): string {
  // Map long names to shorter display names
  const nameMap: Record<string, string> = {
    "Thermostat": "Main",
    "Will's Office": "Will's Office",
    "Laura's Office": "Laura's Office",
    "Master Bedroom": "Bedroom",
  };
  return nameMap[name] || name;
}

interface SensorItemProps {
  sensor: TemperatureSensor;
  useFahrenheit: boolean;
}

function SensorItem({ sensor, useFahrenheit }: SensorItemProps) {
  const tempF = celsiusToFahrenheit(sensor.temperature);
  const displayTemp = useFahrenheit ? Math.round(tempF) : Math.round(sensor.temperature * 10) / 10;
  const tempUnit = useFahrenheit ? '°' : '°C';
  const tempState = getTemperatureState(tempF);

  return (
    <div className={`sensor-item temp-${tempState}`}>
      <span className="sensor-temp">{displayTemp}{tempUnit}</span>
      <span className="sensor-location">{getShortName(sensor.name)}</span>
    </div>
  );
}

export function SensorBar({
  refreshInterval = 300000, // 5 minutes
  useFahrenheit = true,
  sensorNames,
}: SensorBarProps) {
  const { data, loading, error } = useHomebridge({ refreshInterval });

  // Don't show anything while loading initially
  if (loading && !data) {
    return null;
  }

  // Don't show on error (fail silently for ambient display)
  if (error && !data) {
    return null;
  }

  if (!data?.sensors || data.sensors.length === 0) {
    return null;
  }

  // Filter and sort sensors
  let sensors = [...data.sensors];

  if (sensorNames && sensorNames.length > 0) {
    // Show only specified sensors, in the specified order
    sensors = sensorNames
      .map(name => sensors.find(s => s.name === name))
      .filter((s): s is TemperatureSensor => s !== undefined);
  } else {
    // Default order: prioritize rooms over thermostat
    const order = ["Will's Office", "Laura's Office", "Master Bedroom", "Thermostat"];
    sensors.sort((a, b) => {
      const aIndex = order.indexOf(a.name);
      const bIndex = order.indexOf(b.name);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
  }

  if (sensors.length === 0) {
    return null;
  }

  return (
    <div className="sensor-bar">
      {sensors.map((sensor) => (
        <SensorItem
          key={sensor.uniqueId}
          sensor={sensor}
          useFahrenheit={useFahrenheit}
        />
      ))}
    </div>
  );
}
