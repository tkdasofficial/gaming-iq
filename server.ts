import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data/smartphone-db');

function readJsonFile<T>(filename: string): T {
  const fullPath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/admin/dataset', (_req, res) => {
    try {
      const brands = readJsonFile<unknown[]>('brands.json');
      const chipsets = readJsonFile<unknown[]>('chipsets.json');
      const devices = readJsonFile<unknown[]>('devices.json');
      const gameCompatibility = readJsonFile<unknown[]>('game_compatibility.json');
      res.json({
        brands,
        chipsets,
        devices,
        gameCompatibility,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to read smartphone database files.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gaming IQ server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
