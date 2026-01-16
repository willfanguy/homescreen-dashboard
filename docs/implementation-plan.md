# Dashboard Implementation Plan

Master tracking document for all planned features. Small steps, nothing lost.

---

## Infrastructure Prerequisites

These need to happen before certain features can be built.

### Homebridge: API-Only Setup

Homebridge will serve as a **dedicated API layer** for the dashboard, completely separate from HomeKit. Native HomeKit integrations (Ring, TP-Link, etc.) stay as-is. Homebridge plugins run as **child bridges that are NOT paired to HomeKit** to avoid duplicates.

#### Enable API Access ✅
- [x] Confirm Homebridge UI is accessible at `http://192.168.0.155:8581`
- [x] API requires JWT auth even with "auth: none" UI setting
- [x] Auth endpoint: POST `/api/auth/login` with `{"username":"will","password":"..."}` returns JWT
- [x] Use JWT in header: `Authorization: Bearer <token>`
- [x] Test endpoint: `curl http://192.168.0.155:8581/api/accessories -H "Authorization: Bearer <token>"`

#### Add Aqara Plugin - BLOCKED
- [x] Identified hub model: **Aqara E1**
- [x] E1 does NOT support LAN protocol (no local API access)
- [x] Old Homebridge plugins (homebridge-aqara, homebridge-mi-aqara) require LAN protocol
- [ ] **Alternative options:**
  - Zigbee2MQTT with a Zigbee coordinator dongle (~$20-30) - bypasses hub entirely
  - Wait for Aqara to release official cloud API plugin
  - Use other sensors (Ecobee, Hue motion sensors) for temperature data

**Status:** Cannot proceed without LAN protocol or Zigbee coordinator

#### Add Ecobee Plugin (Child Bridge, Unpaired) - IN PROGRESS
- [x] Installed `homebridge-ecobee-status` (only exposes Home/Away/Sleep status)
- [x] Generated refresh token via `npx ecobee-auth-cli`
- [x] Running as child bridge (unpaired from HomeKit)
- [ ] **NEXT:** Install `homebridge-ecobee3-sensors` for actual temperature data
  - GitHub: https://github.com/vojtamolda/homebridge-ecobee3-sensors
  - Note: Ecobee stopped issuing new API keys March 2024, but existing tokens may work
- [ ] Verify thermostat and room sensors appear in API
- [ ] Document available data (thermostat mode, setpoints, room sensor temps)

**Unlocks:** Office Vitality Widget (temp data), potential Thermostat widget

#### Add Hue Plugin (Child Bridge, Unpaired)
- [ ] Install `homebridge-hue` plugin
- [ ] Enable "Child Bridge" mode in plugin settings
- [ ] Configure with Hue bridge credentials
- [ ] **Do NOT pair the child bridge to HomeKit**
- [ ] Verify lights and scenes appear in API
- [ ] Document available data (light states, colors, scenes)
- [ ] Note: Hue motion sensors also have temperature sensors

**Unlocks:** Light status indicator, potential dynamic theming from light colors

### Sonos: Deploy HTTP API ✅
- [x] Deploy `node-sonos-http-api` (Docker on UNRAID)
- [x] Verify it discovers Sonos speakers (5 zones: Roam, Arc, One, Bedroom, Era 100)
- [x] Test `/zones` endpoint returns current playback info
- [x] Document API base URL: `http://192.168.0.155:5005`

**Unlocks:** Sonos Now Playing, Dynamic Theming

---

## Phase 1: Visual Nudge (Calendar & Workday)

Pure frontend work. No external dependencies.

### 1.1 Next Event Countdown Timer ✅
**Files:** `src/components/widgets/NextEventCountdown.tsx`, `src/components/layout/Dashboard.tsx`, `src/App.css`

- [x] Add logic to find the next upcoming event from calendar data
- [x] Create countdown display (hours:minutes or minutes:seconds when close)
- [x] Update countdown every second (or every minute when far away)
- [x] Add color states:
  - Default: normal text color
  - < 15 minutes: amber/warning color
  - < 5 minutes: red, pulsing animation
- [x] Add CSS for pulse animation
- [x] Handle edge case: no upcoming events (widget hidden)
- [x] Only show if next event is within 3 hours (configurable via `maxHoursAhead` prop)
- [x] Position in top-center of dashboard

### 1.2 Workday Progress Bar ✅
**Files:** `src/components/widgets/WorkdayProgressBar.tsx`, `src/config/index.ts`, `src/App.css`

- [x] Add config options for workday start/end times (e.g., 9:00 AM - 5:00 PM)
- [x] Add config option for showOnWeekends
- [x] Create thin progress bar component
- [x] Calculate percentage: `(now - start) / (end - start) * 100`
- [x] Update on interval (every minute)
- [x] Style: gradient fill (green to yellow-green), positioned at top of screen
- [x] Handle outside-workday state (hidden when before/after workday or on weekends)
- [x] Integrate into Dashboard layout
- [x] Timezone-aware calculation

---

## Phase 2: Home Intelligence (Homebridge)

Requires Homebridge API access with Ecobee (and optionally Hue) plugins configured as unpaired child bridges.

### 2.1 Backend: Homebridge API Route ✅
**Files:** `server/routes/homebridge.ts`, `server/index.ts`

- [x] Create new Express route for Homebridge proxy
- [x] Add config for Homebridge URL via environment variable
- [x] Implement JWT authentication with token caching
- [x] Implement `/api/homebridge/accessories` endpoint (raw data)
- [x] Implement `/api/homebridge/sensors` endpoint (filtered temp/humidity)
- [x] Implement `/api/homebridge/lights` endpoint (light states)
- [x] Implement `/api/homebridge/summary` endpoint (combined dashboard data)
- [x] Handle Homebridge being unavailable gracefully

### 2.2 Office Vitality Widget ✅
**Files:** `src/components/widgets/OfficeVitality.tsx`, `src/hooks/useHomebridge.ts`

**Data source:** Ecobee room sensors via Homebridge

- [x] Create `useHomebridge` hook for fetching sensor data
- [x] Widget displays:
  - Temperature (°F or °C)
  - Humidity percentage (from thermostat sensor)
  - Optional: occupancy indicator
- [x] Color-coded temperature states (cold/cool/comfortable/warm/hot)
- [x] Color-coded humidity states (dry/comfortable/humid)
- [x] Added to Dashboard layout (right side, above trash reminder)
- [x] 5-minute refresh interval

### 2.3 Security Status Bar
**Files:** New `src/components/widgets/SecurityStatusBar.tsx`

**Depends on:** Homebridge API route, Aqara contact sensors

- [ ] Identify relevant Aqara contact sensors (doors, windows)
- [ ] Create component that fetches contact sensor states
- [ ] Display logic:
  - All closed: green bar or hidden
  - Something open: amber/red bar, show which door/window
- [ ] Position as footer bar or subtle indicator
- [ ] Handle device unavailable states

### 2.4 Light Status Indicator
**Files:** New `src/components/widgets/LightStatus.tsx`

**Depends on:** Homebridge API route, Hue plugin

- [ ] Fetch light states from Homebridge API
- [ ] Determine display approach:
  - Option A: Room-by-room indicators (dots or icons)
  - Option B: Simple "X lights on" summary
  - Option C: Show active scene name if using Hue scenes
- [ ] Consider subtle placement (corner indicator vs dedicated widget)
- [ ] Optional: Extract dominant light color for ambient theming

---

## Phase 3: Audio & Ambiance (Sonos)

Requires `node-sonos-http-api` running. ✅ Deployed on UNRAID.

### 3.1 Backend: Sonos API Route ✅
**Files:** `server/routes/sonos.ts`, `server/index.ts`

- [x] Create Express route for Sonos proxy
- [x] Add config for Sonos HTTP API URL (env: `SONOS_API_URL`, default: `http://192.168.0.155:5005`)
- [x] Implement `/api/sonos/zones` endpoint (raw data)
- [x] Implement `/api/sonos/now-playing` endpoint (simplified, filtered)
- [x] Implement `/api/sonos/album-art` endpoint (CORS proxy for album art)
- [x] Handle Sonos API unavailable gracefully

### 3.2 Sonos Now Playing Widget ✅
**Files:** `src/components/widgets/SonosNowPlaying.tsx`, `src/hooks/useSonos.ts`

- [x] Create `useSonos` hook for fetching playback state
- [x] Create widget displaying:
  - Album art (80x80)
  - Track title
  - Artist name
  - Speaker/room name
- [x] Show only when actively playing (configurable to show paused)
- [x] Hide when nothing playing
- [x] Add to Dashboard layout (bottom center)
- [x] Configure polling interval (default 10 seconds)

### 3.3 Dynamic Theming (Album Art Colors)
**Files:** `server/routes/sonos.ts`, new theme system

**Depends on:** Sonos Now Playing working

- [ ] Install `node-vibrant` on backend
- [ ] Add endpoint to extract palette from album art URL
- [ ] Return dominant/vibrant colors as hex codes
- [ ] Frontend: create CSS variable system for accent colors
- [ ] Update CSS variables when colors change
- [ ] Add smooth transitions between color schemes
- [ ] Fallback colors when nothing playing

---

## Phase 4: WFH Lifecycle (Automated States)

Time-based dashboard personality changes.

### 4.1 Night Mode ✅
**Files:** `src/components/overlays/NightMode.tsx`, `src/config/index.ts`, `src/App.css`

No external dependencies.

- [x] Add config for night mode time range (default 11 PM - 6 AM)
- [x] Create overlay component with:
  - Black background
  - Dim red clock and date
  - Current temperature with weather icon
  - Next morning event (if before 10 AM)
- [x] Add time-based trigger logic (handles overnight ranges)
- [x] Smooth fade transition (1s ease-in-out)
- [x] Test mode via `?testNightMode=true` URL param

### 4.2 Dashboard Mode System (Work/Home)
**Files:** `src/App.tsx` or `src/components/layout/Dashboard.tsx`, `src/config/index.ts`

- [ ] Define what "Work" widgets are:
  - Calendar
  - Workday Progress Bar
  - Next Event Countdown
  - (others?)
- [ ] Define what "Home" widgets are:
  - Weather (both?)
  - Photos (both?)
  - Sonos Now Playing
  - (need to decide what else)
- [ ] Create mode state management
- [ ] Add config for mode transition times
- [ ] Implement time-based mode switching

### 4.3 Mode Transition Animations
**Files:** Dashboard layout, possibly add Framer Motion

**Depends on:** Dashboard Mode System

- [ ] Install Framer Motion (if not present)
- [ ] Add enter/exit animations for widgets
- [ ] Work widgets: fade/shrink out at end of day
- [ ] Home widgets: fade in
- [ ] Keep shared widgets (weather, photos) stable
- [ ] Test transitions look smooth on Pi hardware

---

## Future Ideas (Parking Lot)

Things mentioned but not fully specced. Add detail when ready to implement.

- [ ] Personal To-Do widget (needs to decide on data source)
- [ ] Evening Weather variant (sunset times, next day preview?)
- [ ] Photo Gallery mode (larger photos in home mode?)
- [ ] Doorbell notification (Ring doorbell ring → visual alert)
- [ ] Energy monitoring from TP-Link plug (if useful)

---

## Implementation Order (Recommended)

Based on dependencies and value:

1. ~~**Phase 1.1** - Next Event Countdown~~ ✅
2. ~~**Phase 1.2** - Workday Progress Bar~~ ✅
3. ~~**Phase 4.1** - Night Mode~~ ✅
4. ~~**Infrastructure: Sonos HTTP API**~~ ✅ (Docker on UNRAID)
5. ~~**Phase 3.1** - Sonos API Route (backend)~~ ✅
6. ~~**Phase 3.2** - Sonos Now Playing Widget~~ ✅
7. ~~**Infrastructure: Homebridge API Access**~~ ✅ (JWT auth at http://192.168.0.155:8581)
8. ~~**Infrastructure: Aqara Plugin**~~ ❌ BLOCKED - E1 hub has no LAN protocol
9. ~~**Infrastructure: Ecobee Plugin**~~ ✅ (homebridge-ecobee3-sensors as child bridge)
10. ~~**Phase 2.1** - Homebridge API Route (backend)~~ ✅
11. ~~**Phase 2.2** - Office Vitality Widget~~ ✅
12. **Phase 3.3** - Dynamic Theming (album art colors)
13. **Infrastructure: Hue Plugin** - Child bridge, unpaired, for light states
14. **Phase 2.3** - Security Status Bar (needs contact sensors - blocked without Aqara/Z2M)
15. **Phase 2.4** - Light Status Indicator
16. **Phase 4.2-4.3** - Mode System (needs "Home" widgets defined first)

---

## Notes

- All Homebridge features require local network access from the Pi
- Sonos HTTP API needs to be on same network as Sonos speakers
- Night mode times should account for timezone (America/Chicago)
- Consider Pi performance for animations (test Framer Motion)
- **Environment Variables:** Sensitive credentials moved to `.env.local` (gitignored). See `.env.example` for required variables and CLAUDE.md for Pi deployment instructions.
