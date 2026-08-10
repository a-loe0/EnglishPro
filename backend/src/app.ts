import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import authRoutes from './routes/auth';
import videoRoutes from './routes/videos';
import courseRoutes from './routes/courses';
import dashboardRoutes from './routes/dashboard';
import progressRoutes from './routes/progress';
import analyticsRoutes from './routes/analytics';
import { errorHandler, notFound } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

  return app;
}

export default createApp;
