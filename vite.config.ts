/// <reference types="vitest/config" />
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * GitHub Pages 没有原生 SPA 回退：把构建产物复制一份为 404.html，
 * 使任意深链接（如 /profile、/guestbook）在刷新后仍能回到应用入口。
 */
function copyIndexTo404(): Plugin {
  return {
    name: 'copy-index-to-404',
    apply: 'build',
    closeBundle() {
      const distDir = resolve(process.cwd(), 'dist')
      copyFileSync(resolve(distDir, 'index.html'), resolve(distDir, '404.html'))
    },
  }
}

export default defineConfig({
  plugins: [react(), copyIndexTo404()],
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
