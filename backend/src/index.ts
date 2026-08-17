import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import courseRoutes from './routes/courses';
import dashboardRoutes from './routes/dashboard';
import progressRoutes from './routes/progress';
import analyticsRoutes from './routes/analytics';
import { errorHandler, notFound } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';
import { initRedisCache } from './middleware/cache';
import { initQueueService, getQueueService } from './services/queue.service';
import { getStorageService } from './services/storage.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// How many reverse proxies sit in front of this process. Without this, req.ip
// is the socket peer — in production that is the nginx container, identical for
// every request on the planet, which collapses all per-IP rate limiting into a
// single shared bucket.
//
// Production chain is Cloudflare -> Caddy -> nginx -> here, so TRUST_PROXY_HOPS=3.
// Defaults to 0 because trusting hops that do not exist lets a client forge
// X-Forwarded-For and choose its own rate-limit key.
const TRUST_PROXY_HOPS = Number(process.env.TRUST_PROXY_HOPS ?? 0);
app.set('trust proxy', Number.isFinite(TRUST_PROXY_HOPS) ? TRUST_PROXY_HOPS : 0);

if (process.env.NODE_ENV === 'production' && !TRUST_PROXY_HOPS) {
  console.warn(
    '[WARN] TRUST_PROXY_HOPS is 0 in production. If this process sits behind a ' +
    'reverse proxy, req.ip is the proxy address and all clients will share one ' +
    'rate-limit bucket. Set it to the number of proxies in front of this app.'
  );
}

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const queueService = getQueueService();
    const stats = await queueService.getStats();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      queues: stats,
    });
  } catch {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize services and start server
async function start() {
  try {
    // Initialize storage directories
    const storage = getStorageService();
    await storage.init();
    console.log('Storage service initialized');

    // Initialize Redis cache
    initRedisCache();
    console.log('Redis cache initialized');

    // Initialize queue service
    await initQueueService();
    console.log('Queue service initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`API endpoints:`);
      console.log(`  - Auth: /api/auth/*`);
      console.log(`  - Videos: /api/videos/*`);
      console.log(`  - Courses: /api/courses/*`);
      console.log(`  - Dashboard: /api/dashboard/*`);
      console.log(`  - Progress: /api/progress/*`);
      console.log(`  - Analytics: /api/analytics/*`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  try {
    const queueService = getQueueService();
    await queueService.shutdown();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  try {
    const queueService = getQueueService();
    await queueService.shutdown();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

start();
