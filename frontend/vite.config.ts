import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Add this line to handle the relative asset path mapping for your subfolder structure
  base: './', 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
