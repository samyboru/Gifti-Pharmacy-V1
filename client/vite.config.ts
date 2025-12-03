import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // --- THIS IS THE CRUCIAL PART ---
      // Any request that starts with '/api' will be forwarded to your backend server
      '/api': {
        target: 'http://localhost:5000', // Your backend server's address
        changeOrigin: true,
        secure: false,      
      },
    }
  }
})