import { Router } from 'express';

export const calendarRouter = Router();

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
