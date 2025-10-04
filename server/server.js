import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import transcribeRouter from './routes/transcribe.js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env
dotenv.config();

// Ensure required folders exist
['uploads', 'transcripts'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', transcribeRouter);

// Health & capabilities
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/capabilities', (_, res) => {
  res.json({
    services: {
      elevateai: { maxSizeMB: 450 },
      assemblyai: { maxSizeMB: 2048 },
      whisper: { maxSizeMB: 25 },
      youtube: {}
    }
  });
});

// Serve static client in production (if built)
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));
  app.get('*', (_, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));