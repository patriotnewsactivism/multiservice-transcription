import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite automatically treats *.jsx and *.tsx as JSX, but the plugin
// also gives us fast Refresh, JSX transform, etc.
export default defineConfig({
  plugins: [react()],
  // You can add more Vite options here (base, server, resolve…) if needed.
});