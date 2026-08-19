import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// Custom plugin to display a named banner when the dev server starts
function namedServerPlugin(name) {
  return {
    name: 'named-server',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const port = server.config.server.port ?? 5178
        console.log(`\n  🚀  \x1b[1m\x1b[36m${name}\x1b[0m`)
        console.log(`  ➜  \x1b[32mLocal:\x1b[0m   http://localhost:\x1b[1m${port}\x1b[0m/\n`)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    namedServerPlugin('IPO Investment Tool'),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5178,        // Pinned to 5178 — won't drift to other ports
    strictPort: true,  // Throws an error instead of silently picking another port
  },
})


