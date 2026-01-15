import { useState, useEffect } from 'react';

interface ClockProps {
  timezone: string;
  showSeconds?: boolean;
  showAmPm?: boolean;
  dateFormat?: string;
}

export function Clock({
  timezone,
  showSeconds = true,
  showAmPm = false,
  // dateFormat reserved for custom formatting - using Intl for now
}: ClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: !showAmPm ? false : true,
    };
    if (showSeconds) {
      options.second = '2-digit';
    }
    return time.toLocaleTimeString('en-US', options);
  };

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      month: 'long',
      day: 'numeric',
    };
    return time.toLocaleDateString('en-US', options);
  };

  return (
    <div className="clock-widget">
      <div className="clock-time">{formatTime()}</div>
      <div className="clock-date">{formatDate()}</div>
    </div>
  );
}
