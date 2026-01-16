# Dashboard Implementation Plan

Master tracking document for all planned features. Small steps, nothing lost.

---

## Infrastructure Prerequisites

These need to happen before certain features can be built.

### Homebridge: Add Aqara Integration
- [ ] Identify which Aqara hub model is in use
- [ ] Research appropriate Homebridge plugin (`homebridge-aqara`, `homebridge-mi-aqara`, or hub-specific)
- [ ] Install and configure plugin in Homebridge
- [ ] Verify sensors appear in Homebridge API (`/api/accessories`)
- [ ] Document which sensors are available and their accessory IDs

**Unlocks:** Office Vitality Widget, Security Status Bar (contact sensors)

### Homebridge: Enable API Access
- [ ] Confirm Homebridge UI is accessible at `http://<server>:8581`
- [ ] Verify auth mode (currently `"auth": "none"` - good for local API access)
- [ ] Test API endpoint: `curl http://<server>:8581/api/accessories`
- [ ] Document API response structure for Ring and TP-Link devices

**Unlocks:** All Homebridge-based widgets

### Sonos: Deploy HTTP API
- [ ] Deploy `node-sonos-http-api` (Docker recommended)
- [ ] Verify it discovers Sonos speakers
- [ ] Test `/state` endpoint returns current playback info
- [ ] Document API base URL for config

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

Requires Homebridge API access. Aqara integration recommended for full functionality.

### 2.1 Backend: Homebridge API Route
**Files:** New `server/routes/homebridge.ts`, `server/index.ts`

- [ ] Create new Express route for Homebridge proxy
- [ ] Add config for Homebridge URL (default `http://localhost:8581`)
- [ ] Implement `/api/homebridge/accessories` endpoint
- [ ] Filter/transform response to only include relevant data
- [ ] Add endpoint for specific accessory by ID if needed
- [ ] Handle Homebridge being unavailable gracefully

### 2.2 Office Vitality Widget
**Files:** New `src/components/widgets/OfficeVitality.tsx`, new hook

**Depends on:** Aqara in Homebridge (for temp/humidity sensors)

- [ ] Create `useHomebridge` hook for fetching accessory data
- [ ] Identify accessory IDs for office sensors
- [ ] Create widget displaying:
  - Temperature (with unit conversion if needed)
  - Humidity percentage
  - Optional: CO2 level if sensor exists
- [ ] Add visual indicators (color coding for comfort ranges)
- [ ] Add to Dashboard layout
- [ ] Configure refresh interval (every 5 minutes?)

### 2.3 Security Status Bar
**Files:** New `src/components/widgets/SecurityStatusBar.tsx`

**Depends on:** Homebridge API route, Ring plugin, optionally Aqara contact sensors

- [ ] Identify relevant device types:
  - Ring: alarm status, contact sensors, motion sensors
  - Aqara: door/window contact sensors
- [ ] Create component that fetches security device states
- [ ] Display logic:
  - All secure: green bar, minimal text
  - Something open/unlocked: red bar, show device name
  - Alarm status indicator (home/away/disarmed)
- [ ] Position as footer bar
- [ ] Handle device unavailable states

---

## Phase 3: Audio & Ambiance (Sonos)

Requires `node-sonos-http-api` running.

### 3.1 Backend: Sonos API Route
**Files:** New `server/routes/sonos.ts`, `server/index.ts`

- [ ] Create Express route for Sonos proxy
- [ ] Add config for Sonos HTTP API URL
- [ ] Implement `/api/sonos/state` endpoint
- [ ] Return: playing status, track info, album art URL, speaker name
- [ ] Handle Sonos API unavailable gracefully

### 3.2 Sonos Now Playing Widget
**Files:** New `src/components/widgets/SonosNowPlaying.tsx`, new hook

- [ ] Create `useSonos` hook for fetching playback state
- [ ] Create widget displaying:
  - Large album art (background-size: cover)
  - Artist name
  - Track title
  - Speaker/room name
- [ ] Show only when actively playing
- [ ] Hide or show placeholder when paused/stopped
- [ ] Add to Dashboard layout (conditionally visible)
- [ ] Configure polling interval

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
4. **Infrastructure: Homebridge API** - Unlocks Phase 2
5. **Infrastructure: Aqara in Homebridge** - Better sensor coverage
6. **Phase 2.1** - Homebridge API Route
7. **Phase 2.2** - Office Vitality Widget
8. **Phase 2.3** - Security Status Bar
9. **Infrastructure: Sonos HTTP API** - Unlocks Phase 3
10. **Phase 3.1-3.2** - Sonos Now Playing
11. **Phase 3.3** - Dynamic Theming (polish)
12. **Phase 4.2-4.3** - Mode System (needs "Home" widgets defined first)

---

## Notes

- All Homebridge features require local network access from the Pi
- Sonos HTTP API needs to be on same network as Sonos speakers
- Night mode times should account for timezone (America/Chicago)
- Consider Pi performance for animations (test Framer Motion)
