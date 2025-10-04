import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import dotenv from 'dotenv';
dotenv.config();

const ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';

/**
 * Transcribe a file (max 25 MB) with OpenAI Whisper.
 * Returns { text, segments } (segments are optional but provided when
 * `response_format=verbose_json` is used).
 */
export async function transcribe(filePath, language = 'en') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('model', 'whisper-1');
  form.append('language', language);
  form.append('response_format', 'verbose_json');

  const response = await axios.post(ENDPOINT, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${apiKey}`
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  const data = response.data;
  // Data shape: { text: "...", segments: [{ start, end, text, ... }] }
  const segments = (data?.segments ?? []).map(s => ({
    start: s.start,
    end: s.end,
    text: s.text
  }));
  return { text: data?.text ?? '', segments };
}