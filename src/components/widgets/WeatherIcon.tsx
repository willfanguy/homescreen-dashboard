interface WeatherIconProps {
  code: number;
  size?: number;
  className?: string;
}

export function WeatherIcon({ code, size = 48, className = '' }: WeatherIconProps) {
  const iconName = getIconName(code);
  const Icon = icons[iconName] || icons.cloudy;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
    >
      <Icon />
    </svg>
  );
}

function getIconName(code: number): keyof typeof icons {
  if (code === 0) return 'sunny';
  if (code <= 2) return 'partlyCloudy';
  if (code === 3) return 'cloudy';
  if (code <= 48) return 'foggy';
  if (code <= 55) return 'drizzle';
  if (code <= 65) return 'rainy';
  if (code <= 75) return 'snowy';
  if (code <= 82) return 'rainy';
  if (code >= 95) return 'thunderstorm';
  return 'cloudy';
}

// SVG path components for each weather condition
const icons = {
  sunny: () => (
    <g>
      <circle cx="12" cy="12" r="5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </g>
    </g>
  ),

  partlyCloudy: () => (
    <g>
      <circle cx="8" cy="8" r="4" fill="currentColor" opacity="0.8" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8">
        <line x1="8" y1="1" x2="8" y2="2.5" />
        <line x1="2.5" y1="3.5" x2="3.5" y2="4.5" />
        <line x1="1" y1="8" x2="2.5" y2="8" />
        <line x1="2.5" y1="12.5" x2="3.5" y2="11.5" />
      </g>
      <path
        d="M8 17h10a4 4 0 0 0 0-8 4.5 4.5 0 0 0-8.5-1.5A3.5 3.5 0 0 0 6 14a3 3 0 0 0 2 3z"
        fill="currentColor"
      />
    </g>
  ),

  cloudy: () => (
    <path
      d="M6 19h12a5 5 0 0 0 0-10 6 6 0 0 0-11.3-2A4.5 4.5 0 0 0 4 15a4 4 0 0 0 2 4z"
      fill="currentColor"
    />
  ),

  foggy: () => (
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="8" x2="21" y2="8" />
      <line x1="5" y1="12" x2="19" y2="12" />
      <line x1="3" y1="16" x2="21" y2="16" />
      <line x1="7" y1="20" x2="17" y2="20" />
    </g>
  ),

  drizzle: () => (
    <g>
      <path
        d="M6 14h10a4 4 0 0 0 0-8 4.5 4.5 0 0 0-8.5-1.5A3.5 3.5 0 0 0 4 11a3 3 0 0 0 2 3z"
        fill="currentColor"
      />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
        <line x1="8" y1="16" x2="8" y2="18" />
        <line x1="12" y1="17" x2="12" y2="19" />
        <line x1="16" y1="16" x2="16" y2="18" />
        <line x1="10" y1="20" x2="10" y2="22" />
        <line x1="14" y1="20" x2="14" y2="22" />
      </g>
    </g>
  ),

  rainy: () => (
    <g>
      <path
        d="M6 13h10a4 4 0 0 0 0-8 4.5 4.5 0 0 0-8.5-1.5A3.5 3.5 0 0 0 4 10a3 3 0 0 0 2 3z"
        fill="currentColor"
      />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8">
        <line x1="8" y1="15" x2="6" y2="21" />
        <line x1="12" y1="15" x2="10" y2="21" />
        <line x1="16" y1="15" x2="14" y2="21" />
      </g>
    </g>
  ),

  snowy: () => (
    <g>
      <path
        d="M6 13h10a4 4 0 0 0 0-8 4.5 4.5 0 0 0-8.5-1.5A3.5 3.5 0 0 0 4 10a3 3 0 0 0 2 3z"
        fill="currentColor"
      />
      <g fill="currentColor" opacity="0.8">
        <circle cx="7" cy="17" r="1.5" />
        <circle cx="12" cy="16" r="1.5" />
        <circle cx="17" cy="17" r="1.5" />
        <circle cx="9" cy="21" r="1.5" />
        <circle cx="15" cy="21" r="1.5" />
      </g>
    </g>
  ),

  thunderstorm: () => (
    <g>
      <path
        d="M6 12h10a4 4 0 0 0 0-8 4.5 4.5 0 0 0-8.5-1.5A3.5 3.5 0 0 0 4 9a3 3 0 0 0 2 3z"
        fill="currentColor"
      />
      <path
        d="M13 12l-3 6h4l-3 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
    </g>
  ),
};
