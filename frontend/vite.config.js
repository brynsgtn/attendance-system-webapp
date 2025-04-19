import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Example: Split dependencies into vendor chunk
          vendor: ['react', 'react-dom', 'axios'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase chunk size warning threshold (in KB)
  },
})
