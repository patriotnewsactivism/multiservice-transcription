import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { selectService } from '../utils/selectService.js';
import * as elevateai from '../services/elevateai.js';
import * as assemblyai from '../services/assemblyai.js';
import * as whisper from '../services/whisper.js';
import * as youtube from '../services/youtube.js';
import { formatTranscript } from '../utils/formatter.js';

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2 GB hard cap
  }
});

/**
 * POST /api/transcribe/file
 * Multipart/form-data: files (multiple), service (auto|elevateai|assemblyai|whisper), language, outputFormat
 */
router.post('/transcribe/file', upload.array('files'), async (req, res) => {
  try {
    const { service = 'auto', language = 'en', outputFormat = 'txt' } = req.body;
    const files = req.files;

    if (!files?.length) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const jobId = uuidv4();
    const jobFolder = path.join('transcripts', jobId);
    fs.mkdirSync(jobFolder, { recursive: true });

    const results = [];

    for (const file of files) {
      // Choose service (auto‑selection if requested)
      const chosenService = service === 'auto' ? selectService(file.size) : service;

      let raw = null;
      if (chosenService === 'elevateai') raw = await elevateai.transcribe(file.path, language);
      else if (chosenService === 'assemblyai') raw = await assemblyai.transcribe(file.path, language);
      else if (chosenService === 'whisper') raw = await whisper.transcribe(file.path, language);
      else throw new Error(`Unsupported service: ${chosenService}`);

      // Format to requested output format
      const formatted = formatTranscript(raw, outputFormat, file.originalname);
      const outFile = `${path.parse(file.originalname).name}.${outputFormat}`;
      const outPath = path.join(jobFolder, outFile);
      fs.writeFileSync(outPath, formatted, 'utf8');

      results.push({
        originalFile: file.originalname,
        service: chosenService,
        format: outputFormat,
        downloadUrl: `/api/download/${jobId}/${outFile}`
      });

      // Clean up original uploaded file
      fs.unlinkSync(file.path);
    }

    res.json({ jobId, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/transcribe/youtube
 * JSON body: { url, language, outputFormat }
 */
router.post('/transcribe/youtube', async (req, res) => {
  try {
    const { url, language = 'en', outputFormat = 'txt' } = req.body;
    if (!url) return res.status(400).json({ error: 'YouTube URL missing' });

    const raw = await youtube.getTranscript(url, language);
    const jobId = uuidv4();
    const jobFolder = path.join('transcripts', jobId);
    fs.mkdirSync(jobFolder, { recursive: true });

    const formatted = formatTranscript(raw, outputFormat, 'youtube');
    const outFile = `youtube.${outputFormat}`;
    const outPath = path.join(jobFolder, outFile);
    fs.writeFileSync(outPath, formatted, 'utf8');

    res.json({
      jobId,
      downloadUrl: `/api/download/${jobId}/${outFile}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/download/:jobId/:filename
 * Streams the generated transcript file.
 */
router.get('/download/:jobId/:filename', (req, res) => {
  const { jobId, filename } = req.params;
  const filePath = path.join('transcripts', jobId, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.download(filePath, filename);
});

export default router;