import express, { Express, ErrorRequestHandler } from 'express';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initDatabase, closeDatabase } from './db/connection.js';
import { runMigration } from './db/migrate.js';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import verifyRoutes from './routes/verify.js';
import auditRoutes from './routes/audit.js';
import userRoutes from './routes/users.js';
import { createRateLimiter } from './middleware/rateLimit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function allowedOrigins(): string[] {
  const raw = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (raw.length) return raw;
  return ['http://localhost:5173', 'http://127.0.0.1:5173'];
}

function isLocalDevOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
}

export function createApp(): Express {
  const app: Express = express();

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      if (!origin || isLocalDevOrigin(origin) || allowedOrigins().includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true
  }));
  app.use(express.json());
  app.use('/api', createRateLimiter(15 * 60 * 1000, 300));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/docs', documentRoutes);
  app.use('/api/verify', verifyRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/users', userRoutes);

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error?.code === 'LIMIT_FILE_SIZE') { res.status(413).json({ success: false, error: 'El archivo supera el límite de 10 MB' }); return; }
    if (error?.message?.includes('File type')) { res.status(400).json({ success: false, error: error.message }); return; }
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  };
  app.use(errorHandler);

  return app;
}

// Initialize and start
async function start() {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const app = createApp();
  const PORT = process.env.PORT || 3000;

  try {
    await initDatabase();
    await runMigration();
    console.log('Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to initialize:', error);
    process.exit(1);
  }
}

// Auto-arranque solo cuando este archivo es el punto de entrada principal
function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return pathToFileURL(path.resolve(entry)).href === import.meta.url;
  } catch {
    return false;
  }
}

if (isMainModule()) {
  // Graceful shutdown (registrados solo en el entry point para no acumular listeners en tests)
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    closeDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down...');
    closeDatabase();
    process.exit(0);
  });

  start();
}

export default createApp();
