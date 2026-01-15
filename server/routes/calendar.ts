import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const calendarRouter = Router();

// Paths for credentials and tokens (separate from photos)
const CREDENTIALS_PATH = path.join(__dirname, '..', 'calendar-credentials.json');
const TOKEN_PATH = path.join(__dirname, '..', 'calendar-token.json');

// Google Calendar API scopes
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

// Google Calendar API base URL
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

let oauth2Client: OAuth2Client | null = null;

// Initialize OAuth client from credentials file
function getOAuthClient(): OAuth2Client | null {
  if (oauth2Client) return oauth2Client;

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    return null;
  }

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

    oauth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

    // Load existing token if available
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
      oauth2Client.setCredentials(token);
    }

    return oauth2Client;
  } catch (error) {
    console.error('Error loading calendar credentials:', error);
    return null;
  }
}

// Proxy iCal feeds to avoid CORS issues
// Usage: GET /api/calendar/ical?url=<encoded-ical-url>
calendarRouter.get('/ical', async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch calendar: ${response.statusText}`
      });
    }

    const icalData = await response.text();
    res.type('text/calendar').send(icalData);
  } catch (error) {
    console.error('Calendar fetch error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check Google Calendar OAuth status
calendarRouter.get('/google/status', (_req, res) => {
  const client = getOAuthClient();

  if (!client) {
    return res.json({
      authenticated: false,
      credentialsConfigured: false,
      error: 'No credentials configured - add calendar-credentials.json'
    });
  }

  const hasToken = fs.existsSync(TOKEN_PATH);
  res.json({
    authenticated: hasToken,
    credentialsConfigured: true
  });
});

// Start OAuth flow - returns URL to visit
calendarRouter.get('/google/auth', (_req, res) => {
  const client = getOAuthClient();

  if (!client) {
    return res.status(500).json({ error: 'OAuth client not configured' });
  }

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  res.json({ authUrl });
});

// OAuth callback - exchange code for tokens
calendarRouter.get('/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const client = getOAuthClient();
  if (!client) {
    return res.status(500).json({ error: 'OAuth client not configured' });
  }

  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Save token for future use
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

    res.json({ success: true, message: 'Calendar authentication successful!' });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Token exchange failed'
    });
  }
});

// List available calendars
calendarRouter.get('/google/calendars', async (_req, res) => {
  const client = getOAuthClient();

  if (!client || !client.credentials.access_token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Refresh token if needed
    if (client.credentials.expiry_date && client.credentials.expiry_date < Date.now()) {
      const { credentials } = await client.refreshAccessToken();
      client.setCredentials(credentials);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
    }

    const response = await fetch(`${CALENDAR_API}/users/me/calendarList`, {
      headers: {
        Authorization: `Bearer ${client.credentials.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    const calendars = (data.items || []).map((cal: any) => ({
      id: cal.id,
      summary: cal.summary,
      primary: cal.primary || false,
      backgroundColor: cal.backgroundColor
    }));

    res.json(calendars);
  } catch (error) {
    console.error('Calendars fetch error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch calendars'
    });
  }
});

// Get events from a specific calendar
calendarRouter.get('/google/events/:calendarId', async (req, res) => {
  const { calendarId } = req.params;
  const { maxResults = '50', timeMin, timeMax } = req.query;

  const client = getOAuthClient();

  if (!client || !client.credentials.access_token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Refresh token if needed
    if (client.credentials.expiry_date && client.credentials.expiry_date < Date.now()) {
      const { credentials } = await client.refreshAccessToken();
      client.setCredentials(credentials);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
    }

    const params = new URLSearchParams({
      maxResults: maxResults as string,
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin: (timeMin as string) || new Date().toISOString(),
    });

    if (timeMax) {
      params.set('timeMax', timeMax as string);
    }

    const encodedCalendarId = encodeURIComponent(calendarId);
    const response = await fetch(
      `${CALENDAR_API}/calendars/${encodedCalendarId}/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${client.credentials.access_token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    const events = (data.items || []).map((event: any) => ({
      id: event.id,
      summary: event.summary || '(No title)',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      allDay: !event.start?.dateTime,
      htmlLink: event.htmlLink
    }));

    res.json(events);
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch events'
    });
  }
});
