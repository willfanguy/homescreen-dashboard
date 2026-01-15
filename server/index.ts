import express from 'express';
import cors from 'cors';
import { calendarRouter } from './routes/calendar.js';
import { photosRouter } from './routes/photos.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Calendar proxy - fetches iCal feeds server-side (avoids CORS)
app.use('/api/calendar', calendarRouter);

// Google Photos - OAuth flow and photo fetching
app.use('/api/photos', photosRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Dashboard API server running on http://localhost:${PORT}`);
});
