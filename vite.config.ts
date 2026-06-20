import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import type { Plugin } from 'vite'

const EMOJI_RE = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}-\u{2B55}\u{23F0}-\u{23FF}]/gu

function stripEmojiFromBuild(): Plugin {
  return {
    name: 'strip-emoji-from-build',
    apply: 'build',
    renderChunk(code) {
      return code.replace(EMOJI_RE, '')
    },
  }
}

export default defineConfig({
  plugins: [react(), stripEmojiFromBuild()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
