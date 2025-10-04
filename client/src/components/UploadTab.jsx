import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
  Typography,
  Paper,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  // add more as needed
];

const SERVICES = [
  { value: 'auto', label: 'Auto (recommended)' },
  { value: 'elevateai', label: 'ElevateAI' },
  { value: 'assemblyai', label: 'AssemblyAI' },
  { value: 'whisper', label: 'OpenAI Whisper' }
];

const FORMATS = [
  { value: 'txt', label: 'Plain Text (.txt)' },
  { value: 'srt', label: 'SubRip (.srt)' },
  { value: 'vtt', label: 'WebVTT (.vtt)' },
  { value: 'json', label: 'JSON (.json)' },
  { value: 'csv', label: 'CSV (.csv)' }
];

export default function UploadTab() {
  const [files, setFiles] = useState([]);
  const [language, setLanguage] = useState('en');
  const [service, setService] = useState('auto');
  const [format, setFormat] = useState('txt');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    const filtered = acceptedFiles.filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      const audioExt = ['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg', 'wma'];
      const videoExt = ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp', 'flv'];
      return audioExt.includes(ext) || videoExt.includes(ext);
    });
    if (filtered.length !== acceptedFiles.length) {
      alert('Some files were ignored because they have unsupported extensions.');
    }
    setFiles(prev => [...prev, ...filtered]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: { 'audio/*': [], 'video/*': [] }
  });

  const removeFile = file => setFiles(prev => prev.filter(f => f !== file));

  const handleSubmit = async () => {
    if (!files.length) {
      alert('Add at least one file before starting.');
      return;
    }
    setUploading(true);
    setProgress(0);
    setError(null);
    setResults([]);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('service', service);
    formData.append('language', language);
    formData.append('outputFormat', format);

    try {
      const resp = await axios.post('/api/transcribe/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: ev => {
          if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total));
        }
      });

      setResults(resp.data.results);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || e.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Box>
      {/* Drag‑and‑drop area */}
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          borderStyle: 'dashed',
          textAlign: 'center',
          bgcolor: isDragActive ? 'action.selected' : 'background.paper',
          cursor: 'pointer'
        }}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h6">
          {isDragActive ? 'Drop files here …' : 'Drag & drop audio/video files, or click to browse'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Supported audio: MP3, WAV, M4A, FLAC, AAC, OGG, WMA
          <br />
          Supported video: MP4, MOV, AVI, MKV, WEBM, 3GP, FLV
        </Typography>
      </Paper>

      {/* File list */}
      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Files ({files.length})</Typography>
          <List>
            {files.map((f, i) => (
              <ListItem
                key={i}
                secondaryAction={
                  <Tooltip title="Remove">
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => removeFile(f)}
                    />
                  </Tooltip>
                }
              >
                <ListItemIcon>
                  <InsertDriveFileIcon />
                </ListItemIcon>
                <ListItemText primary={f.name} secondary={`${(f.size / (1024 * 1024)).toFixed(2)} MB`} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Settings */}
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="lang-label">Language</InputLabel>
              <Select
                labelId="lang-label"
                value={language}
                label="Language"
                onChange={e => setLanguage(e.target.value)}
              >
                {LANGUAGES.map(l => (
                  <MenuItem key={l.code} value={l.code}>
                    {l.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="service-label">Service</InputLabel>
              <Select
                labelId="service-label"
                value={service}
                label="Service"
                onChange={e => setService(e.target.value)}
              >
                {SERVICES.map(s => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="format-label">Output format</InputLabel>
              <Select
                labelId="format-label"
                value={format}
                label="Output format"
                onChange={e => setFormat(e.target.value)}
              >
                {FORMATS.map(f => (
                  <MenuItem key={f.value} value={f.value}>
                    {f.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Action button */}
      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<CloudUploadIcon />}
          onClick={handleSubmit}
          disabled={uploading}
        >
          {uploading ? 'Transcribing…' : 'Start Transcription'}
        </Button>

        {uploading && (
          <Box sx={{ flexGrow: 1 }}>
            <LinearProgress variant={progress ? 'determinate' : 'indeterminate'} value={progress} />
          </Box>
        )}
      </Box>

      {/* Error */}
      {error && (
        <Box sx={{ mt: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6">Transcription results</Typography>
          <List>
            {results.map((r, i) => (
              <ListItem key={i}>
                <ListItemIcon>
                  <InsertDriveFileIcon />
                </ListItemIcon>
                <ListItemText
                  primary={r.originalFile}
                  secondary={`Service: ${r.service} | Format: ${r.format}`}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  href={r.downloadUrl}
                  target="_blank"
                >
                  Download
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}