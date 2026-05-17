// FILE: backend/src/app.js
// Express application factory — configures all middleware, routes, and error handling

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const logger = require('./utils/logger');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middlewares/errorHandler');
const { rateLimitApi } = require('./middlewares/rateLimiter');

// Routes
const authRoutes = require('./routes/auth.routes');
const fileRoutes = require('./routes/file.routes');
const adminRoutes = require('./routes/admin.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

// ── Security headers ────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ────────────────────────────────────────────────────────────
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Prevent JSON DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Compression ─────────────────────────────────────────────────────
app.use(compression());

// ── HTTP logging ─────────────────────────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: () => env.NODE_ENV === 'test',
  })
);

// ── Trust proxy (for correct IP in rate limiter behind Nginx/load balancer) ─
app.set('trust proxy', 1);

// ── Global rate limiter ──────────────────────────────────────────────
app.use(`/api/${env.API_VERSION}`, rateLimitApi);

// ── API Routes ───────────────────────────────────────────────────────
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/files', fileRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/health', healthRoutes);

app.use(`/api/${env.API_VERSION}`, apiRouter);

// ── Swagger UI ────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info(`📚 Swagger docs: http://localhost:${env.PORT}/api/docs`);
}

// ── 404 handler ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});

// ── Centralized error handler (must be last) ──────────────────────────
app.use(errorHandler);

module.exports = app;
