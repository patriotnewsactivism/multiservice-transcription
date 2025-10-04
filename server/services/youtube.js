import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Retrieve the subtitles (captions) from a public YouTube video.
 * Returns { text, segments }.
 */
export async function getTranscript(videoUrl, language = 'en') {
  const videoId = extractId(videoUrl);
  if (!videoId) throw new Error('Invalid YouTube URL');

  // Try the "timedtext" endpoint – works only if captions exist for the language
  const captionsUrl = `https://video.google.com/timedtext?lang=${language}&v=${videoId}`;

  const resp = await axios.get(captionsUrl);
  if (!resp.data) throw new Error('No caption data returned from YouTube');

  const result = await parseStringPromise(resp.data);
  // result.transcript.text is an array of { _: 'caption text', $: { start: '12.34', dur: '2.1' } }
  if (!result.transcript || !result.transcript.text) {
    throw new Error('Captions not available for this video/language');
  }

  const segments = result.transcript.text.map(item => {
    const start = parseFloat(item.$.start);
    const dur = parseFloat(item.$.dur);
    const text = item._;
    return { start, end: start + dur, text };
  });

  const fullText = segments.map(s => s.text).join(' ');
  return { text: fullText, segments };
}

/* ---------- helper ----------
   Extract the video ID from multiple possible YouTube URL formats
*/
function extractId(url) {
  try {
    const u = new URL(url);
    // Short URL youtu.be/VIDEOID
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    // Standard URL youtube.com/watch?v=VIDEOID
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    // Embed or other formats
    const match = u.pathname.match(/\/embed\/([^/?]+)/);
    if (match) return match[1];
    return null;
  } catch {
    return null;
  }
}