import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'

const src = (folder: string) => fileURLToPath(new URL(folder, import.meta.url))

const dropMockServiceWorker: Plugin = {
  name: 'drop-mock-service-worker',
  apply: 'build',
  closeBundle() {
    rmSync(src('./dist/mockServiceWorker.js'), { force: true })
  },
}

export default defineConfig({
  plugins: [react(), dropMockServiceWorker],
  resolve: {
    alias: {
      '@features': src('./src/features'),
      '@shared': src('./src/shared'),
      '@widgets': src('./src/widgets'),
      '@entities': src('./src/entities'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/shared/test/setup.ts'],
    css: false,
  },
})
