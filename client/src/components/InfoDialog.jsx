import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Link
} from '@mui/material';

export default function InfoDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>About This App</DialogTitle>
      <DialogContent dividers>
        <DialogContentText sx={{ mb: 2 }}>
          Upload audio/video files or paste a YouTube URL and let the app automatically pick the
          most suitable transcription service (ElevateAI, AssemblyAI, OpenAI Whisper, or YouTube
          captions). Choose the language and the output format you need (TXT, SRT, VTT, JSON, CSV)
          and download the result.
        </DialogContentText>

        <List dense>
          <ListItem>
            <ListItemText primary="🔹 Services" secondary="ElevateAI, AssemblyAI, OpenAI Whisper, YouTube captions" />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="🔹 Auto‑selection rules"
              secondary="≤ 25 MB → Whisper | ≤ 450 MB → ElevateAI | ≤ 2 GB → AssemblyAI"
            />
          </ListItem>
          <ListItem>
            <ListItemText primary="🔹 Output formats" secondary="TXT, SRT, VTT, JSON, CSV" />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="🔹 Source code"
              secondary={<Link href="https://github.com/patriotnewsactivism/whisper" target="_blank" rel="noopener">GitHub repository</Link>}
            />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}