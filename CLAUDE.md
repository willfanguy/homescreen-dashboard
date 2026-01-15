# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Raspberry Pi dashboard application replacing DAKboard. Displays photos, weather, calendar events, and time on a 1920x1080 display in kiosk mode.

## Commands

```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # TypeScript check + production build to dist/
npm run preview  # Preview production build locally
npm run lint     # ESLint check
```

## Architecture

### Tech Stack
- React 19 + TypeScript
- Vite for build/dev
- Open-Meteo API for weather (free, no API key)
- Google Calendar via iCal URLs
- iCloud Shared Albums for photos

### Project Structure

```
src/
├── components/
│   ├── layout/       # Dashboard layout components
│   └── widgets/      # Individual widgets (Clock, Weather, Calendar, PhotoBackground)
├── hooks/            # Data fetching hooks (useWeather, useCalendar, usePhotos)
├── services/         # API integrations (if needed beyond hooks)
├── types/            # TypeScript type definitions
└── config/           # Dashboard configuration
```

### Key Files
- `src/config/index.ts` - All dashboard settings (timezone, location, calendar sources, photo source)
- `src/components/layout/Dashboard.tsx` - Main layout composing all widgets
- `src/hooks/useWeather.ts` - Open-Meteo integration
- `src/hooks/useCalendar.ts` - iCal parsing for Google Calendar
- `src/hooks/usePhotos.ts` - iCloud Shared Album fetching

### Configuration

Edit `src/config/index.ts` to customize:
- `timezone` - Display timezone (default: America/Chicago)
- `weather.lat/lon` - Location for weather (default: Austin, TX)
- `calendars[]` - Array of calendar sources with iCal URLs
- `photos.albumId` - iCloud Shared Album ID

### Data Flow
1. `Dashboard` component mounts and calls data hooks
2. Hooks fetch data on mount and set up refresh intervals:
   - Weather: every 15 minutes
   - Calendar: every 5 minutes
   - Photos: every hour (photo rotation handled separately)
3. Widgets receive data via props and render

### Deployment to Pi
Build and serve static files:
```bash
npm run build
# Copy dist/ to Pi
# Serve with nginx or similar, open in Chromium kiosk mode
```

## DAKboard Reference

Original DAKboard exports are in `dakboard-exports/` for reference. The decoded config shows:
- Widget positions and sizes (percentage-based)
- Calendar sources (Google Calendar IDs)
- Photo source (iCloud Shared Album)
- Weather location coordinates
