# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Raspberry Pi dashboard application replacing DAKboard. Displays photos, weather, calendar events, and time on a 1920x1080 display in kiosk mode.

## Commands

```bash
npm run dev          # Start both frontend (Vite) and backend (Express) servers
npm run dev:client   # Start only Vite dev server (http://localhost:5173)
npm run dev:server   # Start only Express API server (http://localhost:3001)
npm run build        # TypeScript check + production build to dist/
npm run start:server # Run API server in production
npm run lint         # ESLint check
```

## Architecture

### Two-Account Design

This dashboard uses two separate Google accounts:

1. **Calendar: Work Google Account**
   - Uses iCal URLs (no OAuth needed)
   - Work account already has personal calendars merged/imported
   - Get URLs from: Google Calendar > Settings > [Calendar] > "Secret address in iCal format"

2. **Photos: Personal Google Account**
   - Uses Google Photos API with OAuth
   - Requires `server/credentials.json` from Google Cloud Console
   - One-time browser auth flow, tokens stored in `server/token.json`

### System Components

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + Vite)  :5173                     │
│  - Dashboard UI                                      │
│  - Widgets: Clock, Calendar, Weather, Photos        │
└────────────────────┬────────────────────────────────┘
                     │ HTTP
┌────────────────────▼────────────────────────────────┐
│  Backend (Express)  :3001                           │
│  - /api/calendar/ical?url=  (CORS proxy for iCal)  │
│  - /api/photos/*            (Google Photos OAuth)   │
└─────────────────────────────────────────────────────┘
```

### Project Structure

```
├── src/                    # Frontend React app
│   ├── components/
│   │   ├── layout/         # Dashboard layout
│   │   └── widgets/        # Clock, Weather, Calendar, PhotoBackground
│   ├── hooks/              # useWeather, useCalendar, usePhotos
│   ├── types/              # TypeScript definitions
│   └── config/index.ts     # All dashboard settings
├── server/                 # Backend Express API
│   ├── index.ts            # Server entry point
│   ├── routes/
│   │   ├── calendar.ts     # iCal proxy
│   │   └── photos.ts       # Google Photos OAuth + API
│   ├── credentials.json    # Google OAuth credentials (create this)
│   └── token.json          # OAuth tokens (auto-generated)
└── dakboard-exports/       # Original DAKboard config for reference
```

## Setup Instructions

### 1. Calendar Setup (Work Account)

1. Go to Google Calendar (logged into work account)
2. Settings > [Select calendar] > "Secret address in iCal format"
3. Copy each calendar's iCal URL
4. Add URLs to `src/config/index.ts` in the `calendars` array

### 2. Google Photos Setup (Personal Account)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Photos Library API"
4. Create OAuth 2.0 credentials (Desktop app type)
5. Download credentials and save as `server/credentials.json`
6. Run `npm run dev` and visit `http://localhost:3001/api/photos/auth`
7. Complete the OAuth flow in browser
8. Get album list: `curl http://localhost:3001/api/photos/albums`
9. Add album ID to `src/config/index.ts` > `photos.albumId`

### 3. Weather

Weather uses Open-Meteo (free, no API key). Just set lat/lon in config.

## Data Refresh Intervals

- Weather: every 15 minutes
- Calendar: every 5 minutes
- Photos list: every hour
- Photo rotation: configurable (default 5 minutes)

## Deployment to Pi

```bash
npm run build
# Copy dist/ and server/ to Pi
# Run: node server/index.js (or use PM2)
# Open Chromium in kiosk mode pointed at localhost
```

## DAKboard Reference

Original exports in `dakboard-exports/` show:
- Widget positions (percentage-based)
- Calendar IDs and colors
- Weather coordinates
- Photo album configuration
