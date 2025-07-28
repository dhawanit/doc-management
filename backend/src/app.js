import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'reflect-metadata';
import { AppDataSource } from './config/data-source.js';

import documentRoutes from './modules/document/document.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import notificationRoutes from './modules/notification/notification.routes.js';
import { apiRateLimiter, loginRateLimiter } from './middleware/rateLimit.middleware.js';
import { securityHeaders, ipBlocker } from './middleware/security.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(securityHeaders);
app.use(ipBlocker);
app.use(apiRateLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/documents', documentRoutes);
app.use('/admin', adminRoutes);
app.use('/audit', auditRoutes);
app.use('/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Data Source initialization error:', err);
  });