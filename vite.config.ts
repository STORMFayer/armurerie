import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  // deux pages : la caisse RDR2 (index.html) et la version « clean » (clean.html)
  build: { rollupOptions: { input: { main: path.resolve(import.meta.dirname, 'index.html'), clean: path.resolve(import.meta.dirname, 'clean.html') } } },
})
