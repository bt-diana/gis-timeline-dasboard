import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const src = (folder: string) => fileURLToPath(new URL(folder, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': src('./src/app'),
      '@features': src('./src/features'),
      '@shared': src('./src/shared'),
      '@store': src('./src/shared/store'),
      '@widgets': src('./src/widgets'),
      '@pages': src('./src/pages'),
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
