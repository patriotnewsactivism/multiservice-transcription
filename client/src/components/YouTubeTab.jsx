import React, { useState } from 'react';
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
import { YouTube as YouTubeIcon, Download as DownloadIcon } from '@mui/icons-material';
import axios from 'axios';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' }
];

const FORMATS = [
  { value: 'txt', label: 'Plain Text (.txt)' },
  { value: 'srt', label: 'SubRip (.srt)' },
  { value: 'vtt', label: 'WebVTT (.vtt)' },
  { value: 'json', label: 'JSON (.json)' },
  { value: 'csv', label: 'CSV (.csv)' }
];

export default function YouTubeTab() {
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [format, setFormat] = useState('txt');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTranscribe = async () => {
    if (!url) {
      alert('Please paste a YouTube URL');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);
    try {
      const resp = await axios.post(
        '/api/transcribe/youtube',
        { url, language, outputFormat: format },
        {
          onUploadProgress: ev => {
            if (ev.total) setProgress(Math.round((ev.loaded * 100) / ev.total));
          }
        }
      );
      setResult(resp.data);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="YouTube URL"
              placeholder="https://www.youtube.com/watch?v=…"
              fullWidth
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </Grid>

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

          <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<YouTubeIcon />}
              fullWidth
              onClick={handleTranscribe}
              disabled={loading}
            >
              {loading ? 'Processing…' : 'Transcribe'}
            </Button>
          </Grid>
        </Grid>

        {loading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant={progress ? 'determinate' : 'indeterminate'} value={progress} />
          </Box>
        )}

        {error && (
          <Box sx={{ mt: 2 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {result && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Ready to download</Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <DownloadIcon />
                </ListItemIcon>
                <ListItemText primary="YouTube transcript" />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  href={result.downloadUrl}
                  target="_blank"
                >
                  Download
                </Button>
              </ListItem>
            </List>
          </Box>
        )}
      </Paper>
    </Box>
  );
}