# Homescreen Dashboard

A Raspberry Pi kiosk dashboard displaying photos, weather, calendar events, and time on a 1920×1080 display. Built as a self-hosted replacement for DAKboard.

## Features

- **Google Photos** — rotating photo background from a shared album (personal Google account, OAuth)
- **Google Calendar** — upcoming events from multiple calendars via iCal URLs (no OAuth needed)
- **Weather** — current conditions and forecast via [Open-Meteo](https://open-meteo.com/) (free, no API key)
- **Clock** — full-screen time display

## Architecture

```
Frontend (React + Vite)  :5173
  Widgets: Clock, Calendar, Weather, PhotoBackground

Backend (Express)  :3001
  /api/calendar/ical  — CORS proxy for iCal feeds
  /api/photos/*       — Google Photos OAuth + API
```

Uses a two-account design: work Google account for calendar (iCal URLs), personal Google account for photos (OAuth).

## Setup

### Prerequisites

- Node.js 18+
- A Google Cloud project with the Photos Library API enabled (for photos)
- iCal URLs from Google Calendar (for calendar)

### Install

```bash
git clone https://github.com/willfanguy/homescreen-dashboard
cd homescreen-dashboard
npm install
```

### Calendar

1. In Google Calendar, go to Settings > [Calendar] > "Secret address in iCal format"
2. Add the URL(s) to `src/config/index.ts` in the `calendars` array

### Google Photos

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Photos Library API
3. Create OAuth 2.0 credentials (Desktop app type) and download as `server/credentials.json`
4. Run `npm run dev` and visit `http://localhost:3001/api/photos/auth`
5. Complete the OAuth flow; tokens are saved to `server/token.json`
6. Get your album ID: `curl http://localhost:3001/api/photos/albums`
7. Set `photos.albumId` in `src/config/index.ts`

### Weather

Set your latitude and longitude in `src/config/index.ts`. No API key required.

### Development

```bash
npm run dev        # Start both frontend (5173) and backend (3001)
npm run dev:client # Frontend only
npm run dev:server # Backend only
npm run build      # Production build to dist/
```

### Deployment (Raspberry Pi)

```bash
npm run build
# Copy dist/ and server/ to the Pi
```

Create `/home/pi/.env.dashboard` with your secrets (see `.env.example` if present), then run the Express server with PM2 or similar. Point Chromium at `http://localhost:5173` in kiosk mode.

## License

MIT — see [LICENSE](LICENSE)
