/**
 * Convert the raw transcript (either a plain string or an object with
 * `{ text, segments }`) into the desired output format.
 *
 * @param {object|string} raw
 * @param {'txt'|'srt'|'vtt'|'json'|'csv'} format
 * @param {string} baseFilename – used for building file name (not used directly)
 * @returns {string}
 */
export function formatTranscript(raw, format, baseFilename) {
  if (typeof raw === 'string') raw = { text: raw, segments: [] };
  const { text, segments } = raw;

  switch (format) {
    case 'txt':
      return text;
    case 'srt':
      return segmentsToSRT(segments);
    case 'vtt':
      return segmentsToVTT(segments);
    case 'json':
      return JSON.stringify(raw, null, 2);
    case 'csv':
      return segmentsToCSV(segments);
    default:
      return text;
  }
}

/** Helpers ---------------------------------------------------------------- */

function secondsToTimestamp(seconds, type = 'srt') {
  const ms = Math.floor((seconds % 1) * 1000);
  const total = Math.floor(seconds);
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  const sep = type === 'srt' ? ',' : '.';
  const pad = (n, z = 2) => String(n).padStart(z, '0');
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}${sep}${pad(ms, 3)}`;
}

function segmentsToSRT(segments) {
  if (!segments?.length) return '';
  return segments
    .map((s, i) => `${i + 1}\n${secondsToTimestamp(s.start)} --> ${secondsToTimestamp(s.end)}\n${s.text.trim()}\n`)
    .join('\n');
}

function segmentsToVTT(segments) {
  if (!segments?.length) return '';
  const header = 'WEBVTT\n\n';
  const body = segments
    .map((s, i) => `${i + 1}\n${secondsToTimestamp(s.start, 'vtt')} --> ${secondsToTimestamp(s.end, 'vtt')}\n${s.text.trim()}\n`)
    .join('\n');
  return header + body;
}

function segmentsToCSV(segments) {
  if (!segments?.length) return '';
  const header = 'start,end,text';
  const rows = segments.map(s => {
    const start = s.start.toFixed(3);
    const end = s.end.toFixed(3);
    const txt = `"${s.text.replace(/"/g, '""')}"`;
    return `${start},${end},${txt}`;
  });
  return [header, ...rows].join('\n');
}