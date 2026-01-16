This plan outlines specific features and technical "blueprints" you can hand off to **Claude Code** to implement in your `homescreen-dashboard` repo. Since your dashboard is non-interactive and runs on a Raspberry Pi, these focus on **automation, data-streaming, and visual state changes.**

### Phase 1: The "Visual Nudge" (Calendar & Workday)

**Goal:** Enhance the existing calendar to provide immediate time-awareness for a WFH setting.

- **Next Event Countdown:**
  - **Feature:** A high-visibility timer that calculates the time remaining until the next `start` time in your calendar array.
  - **Logic:** If the event is < 15 mins away, turn the text **Amber**. If < 5 mins, make it **Pulse Red**.
  - **Claude Code Prompt:** _"Modify Calendar.tsx to find the next upcoming event. Add a 'Next Event' countdown timer that updates every second. Add logic to change CSS classes based on time remaining."_
- **Workday Progress Bar:**
  - **Feature:** A thin gradient bar (e.g., at the very top of the screen) that fills from 0% to 100% between your start and end times (e.g., 9 AM – 5 PM).
  - **Claude Code Prompt:** _"Create a WorkdayProgressBar component that takes a startTime and endTime prop. Use an interval to update the width of a div to represent the percentage of the workday completed."_

---

### Phase 2: Home Intelligence (Homebridge & Apple Home)

**Goal:** Use your Homebridge server to display the status of your "Walled Garden" devices.

- **Office Vitality Widget:**
  - **Feature:** Display CO2 levels or temperature from HomeKit sensors.
  - **Backend:** Use your Node server to fetch data from the Homebridge API (`/api/accessories`).
  - **Claude Code Prompt:** _"Add an endpoint to the Node server that authenticates with my Homebridge API and returns the 'CurrentTemperature' and 'CarbonDioxideLevel' characteristics of my office sensors. Create a React widget to display this."_
- **Home Security "Strips":**
  - **Feature:** A footer bar that is green if all "Lock" and "Contact" sensors are "Closed/Locked." It turns red and displays the name of the open sensor (e.g., "Garage Door Open").
  - **Claude Code Prompt:** _"Create a SecurityStatusBar component. Fetch device states from the backend. If any device with the service type 'LockMechanism' is '1' (unlocked), change the bar color to red."_

---

### Phase 3: Audio & Ambiance (Sonos/HomePod)

**Goal:** Display what's playing in the house without needing to check your phone.

- **Sonos "Now Playing" Cover Art:**
  - **Feature:** When a Sonos speaker is active, replace a section of the dashboard with a large, high-res version of the current album art.
  - **Integration:** Connect to the `node-sonos-http-api` running on your server.
  - **Claude Code Prompt:** _"Create a SonosWidget. It should poll the /state endpoint of my Sonos HTTP API. If playing, display the 'albumArtUri' as a background-size: cover image and show the artist/track title."_
- **Dynamic Themeing (Vibrant):**
  - **Feature:** The dashboard’s accent colors (borders, icons) change to match the primary color of the album art currently playing.
  - **Claude Code Prompt:** _"Use the 'node-vibrant' library on the backend to extract the palette from the Sonos album art URL. Send these hex codes to the frontend via a WebSocket or API to update CSS variables."_

---

### Phase 4: WFH Lifecycle (Automated States)

**Goal:** Change the "personality" of the dashboard based on your schedule.

- **The "End of Day" Transition:**
  - **Feature:** At 5:00 PM, the dashboard automatically triggers a CSS transition. The "Work" widgets (Calendar, Workday Bar) fade out or shrink, and "Home" widgets (Personal To-Do, Evening Weather, Photo Gallery) fade in.
  - **Claude Code Prompt:** _"Implement a 'DashboardMode' state (Work/Home). Add a check in the main loop to switch modes based on the time of day. Use Framer Motion to animate the transition between widget sets."_
- **Night/Sleep Mode:**
  - **Feature:** Between 11 PM and 6 AM, the dashboard turns black with only a dim, deep-red clock (to prevent room glow and screen burn-in).
  - **Claude Code Prompt:** _"Create a NightMode overlay that triggers based on a time range. Ensure it uses low-intensity colors to be eye-friendly in the dark."_

### Implementation Checklist for you:

1.  **Homebridge:** Ensure "Insecure Mode" is enabled in your Homebridge settings so your Node server can talk to it locally.
2.  **Sonos:** Deploy the `node-sonos-http-api` (easiest via Docker) on your home server.
3.  **Claude Code:** Give it access to your `server/index.ts` and `src/components/` folders simultaneously so it can build the full "Data -> API -> UI" pipeline.
