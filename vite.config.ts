import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const src = (folder: string) => fileURLToPath(new URL(folder, import.meta.url))

export default defineConfig({
  plugins: [react()],
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
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
