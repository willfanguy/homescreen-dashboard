import { useState, useEffect } from 'react';

interface ClockProps {
  timezone: string;
  showSeconds?: boolean;
  showAmPm?: boolean;
  use24Hour?: boolean;
}

export function Clock({
  timezone,
  showSeconds = true,
  showAmPm = true,
  use24Hour = false,
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
      hour12: !use24Hour,
    };
    if (showSeconds) {
      options.second = '2-digit';
    }
    let timeStr = time.toLocaleTimeString('en-US', options);
    if (!showAmPm && !use24Hour) {
      // Remove AM/PM if not wanted
      timeStr = timeStr.replace(/\s?(AM|PM)$/i, '');
    }
    return timeStr;
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
