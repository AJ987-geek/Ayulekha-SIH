import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'chatbot-api-middleware',
      configureServer(server) {
        server.middlewares.use('/api/chat', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }
          // Read body
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              req.body = JSON.parse(body || '{}');
            } catch (e) {
              req.body = {};
            }
            // Polyfill res.status and res.json for the Vercel handler
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            };
            
            try {
              const { default: handler } = await import('./api/chat.js');
              await handler(req, res);
            } catch (error) {
              console.error(error);
              res.status(500).json({ error: error.message });
            }
          });
        });
      }
    }
  ],
  publicDir: '../../public',
  resolve: {
    alias: {
      '/src': path.resolve(__dirname, '../../src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
