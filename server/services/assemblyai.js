import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const UPLOAD_URL = 'https://api.assemblyai.com/v2/upload';
const TRANSCRIBE_URL = 'https://api.assemblyai.com/v2/transcript';

export async function transcribe(filePath, language = 'en') {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) throw new Error('ASSEMBLYAI_API_KEY not set');

  // 1️⃣ Upload file
  const uploadForm = new FormData();
  uploadForm.append('file', fs.createReadStream(filePath), path.basename(filePath));

  const uploadRes = await axios.post(UPLOAD_URL, uploadForm, {
    headers: {
      ...uploadForm.getHeaders(),
      authorization: apiKey
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  const audioUrl = uploadRes.data?.upload_url;
  if (!audioUrl) throw new Error('Failed to obtain upload URL from AssemblyAI');

  // 2️⃣ Request transcription
  const transcriptRes = await axios.post(
    TRANSCRIBE_URL,
    {
      audio_url: audioUrl,
      language_code: language,
      // Optional features
      speaker_labels: true // diarization
    },
    {
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json'
      }
    }
  );

  const transcriptId = transcriptRes.data?.id;
  if (!transcriptId) throw new Error('Failed to start AssemblyAI transcription');

  // 3️⃣ Poll until completed
  return await pollResult(transcriptId, apiKey);
}

/* ---- polling helper ---- */
async function pollResult(transcriptId, apiKey) {
  const url = `${TRANSCRIBE_URL}/${transcriptId}`;
  const interval = 5000;
  const maxAttempts = 120; // up to 10 min

  for (let i = 0; i < maxAttempts; i++) {
    const res = await axios.get(url, {
      headers: { authorization: apiKey }
    });
    const { status, text, words } = res.data;
    if (status === 'completed') {
      // Convert words → segments with timestamps
      const segments = (words ?? []).map(w => ({
        start: w.start / 1000,
        end: w.end / 1000,
        text: w.text
      }));
      return { text, segments };
    }
    if (status === 'error') {
      throw new Error(`AssemblyAI error: ${res.data.error}`);
    }
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error('AssemblyAI transcription timeout');
}