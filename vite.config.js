import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    host: true,
    port: 5173,
    allowedHosts: "all",
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          // Log des erreurs proxy pour déboguer facilement
          proxy.on('error', (err) => {
            console.error('[PROXY ERROR]', err.message);
          });
        },
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
