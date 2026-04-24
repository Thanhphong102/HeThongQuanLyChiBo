import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Cho phép truy cập từ thiết bị khác trong LAN
    port: 5173
  }
})
