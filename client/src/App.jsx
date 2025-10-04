import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  Container,
  IconButton,
  Tooltip
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import UploadTab from './components/UploadTab.jsx';
import YouTubeTab from './components/YouTubeTab.jsx';
import InfoDialog from './components/InfoDialog.jsx';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Multi‑Service Transcription
          </Typography>
          <Tooltip title="Info & Docs">
            <IconButton color="inherit" onClick={() => setInfoOpen(true)}>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="transcription tabs">
            <Tab label="File Upload" />
            <Tab label="YouTube URL" />
          </Tabs>
        </Box>

        <TabPanel value={tab} index={0}>
          <UploadTab />
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <YouTubeTab />
        </TabPanel>
      </Container>

      <InfoDialog open={infoOpen} onClose={() => setInfoOpen(false)} />
    </>
  );
}