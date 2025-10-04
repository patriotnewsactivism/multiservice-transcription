/**
 * Choose the best transcription service based on file size.
 * @param {number} fileSizeBytes
 * @returns {'whisper'|'elevateai'|'assemblyai'}
 */
export function selectService(fileSizeBytes) {
  const MB = 1024 * 1024;
  const sizeMB = fileSizeBytes / MB;

  if (sizeMB <= 25) return 'whisper';
  if (sizeMB <= 450) return 'elevateai';
  if (sizeMB <= 2048) return 'assemblyai';
  // If larger than 2 GB we still pick AssemblyAI but the client should warn the user.
  return 'assemblyai';
}