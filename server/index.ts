import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local (Vite convention)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
// Also try .env as fallback
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import express from 'express';
import cors from 'cors';
import { calendarRouter } from './routes/calendar.js';
import { photosRouter } from './routes/photos.js';
import { sonosRouter } from './routes/sonos.js';
import { homebridgeRouter } from './routes/homebridge.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Calendar proxy - fetches iCal feeds server-side (avoids CORS)
app.use('/api/calendar', calendarRouter);

// Google Photos - OAuth flow and photo fetching
app.use('/api/photos', photosRouter);

// Sonos - playback state from Sonos HTTP API
app.use('/api/sonos', sonosRouter);

// Homebridge - sensor and light data
app.use('/api/homebridge', homebridgeRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files from dist/ in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback - serve index.html for any non-API routes
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Dashboard API server running on http://localhost:${PORT}`);
});
