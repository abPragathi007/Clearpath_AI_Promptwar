import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [react()],

    // ✅ Fix for GitHub Pages (IMPORTANT)
    base: isProduction ? '/Clearpath_AI_Promptwar/' : '/',

    server: {
      port: 5173,
      proxy: {
        '/api': 'http://localhost:3001', // your backend
      },
    },

    // ✅ FIXED BUILD OUTPUT (THIS WAS THE MAIN ISSUE)
    build: {
      outDir: 'dist',      // ⚠️ must be 'dist' (NOT dist/client)
      emptyOutDir: true,
    },
  }
})