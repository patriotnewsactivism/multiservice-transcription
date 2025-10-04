import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const ENDPOINT = 'https://api.elevate.ai/v1/transcribe';

/**
 * Transcribe a local file using ElevateAI.
 * Returns { text, segments } (segments optional but recommended).
 */
export async function transcribe(filePath, language = 'en') {
  const apiKey = process.env.ELEVATEAI_API_KEY;
  if (!apiKey) throw new Error('ELEVATEAI_API_KEY not set');

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), path.basename(filePath));
  form.append('language', language);

  const headers = {
    ...form.getHeaders(),
    Authorization: `Bearer ${apiKey}`
  };

  // Most ElevateAI accounts return the transcript synchronously.
  const resp = await axios.post(ENDPOINT, form, {
    headers,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 300_000 // 5 min
  });

  // Expected shape: { text: "...", segments: [...] }
  if (resp.data?.text) return { text: resp.data.text, segments: resp.data.segments || [] };

  // If the API returns a job ID, poll until completed.
  if (resp.data?.id) {
    return await pollResult(resp.data.id, apiKey);
  }

  throw new Error('Unexpected ElevateAI response');
}

/* ---- polling helper (in case the API is async) ---- */
async function pollResult(jobId, apiKey) {
  const url = `${ENDPOINT}/${jobId}`;
  const interval = 5000;
  const maxAttempts = 60; // up to 5 min

  for (let i = 0; i < maxAttempts; i++) {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const { status, text, segments } = res.data;
    if (status === 'completed') {
      return { text, segments: segments || [] };
    }
    if (status === 'failed') throw new Error('ElevateAI transcription failed');
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error('ElevateAI transcription timeout');
}