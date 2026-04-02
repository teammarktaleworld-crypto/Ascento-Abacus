'use strict';

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');

const logger = require('./utils/logger');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./core/AppError');
const routes = require('./routes');

const app = express();

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-key'],
    credentials: true,
  }),
);

// ─── Compression ─────────────────────────────────────────────────────────────
app.use(compression());

// ─── Rate limiting ───────────────────────────────────────────────────────────
app.use(rateLimiter);

// ─── HTTP request logging (Morgan → Winston) ─────────────────────────────────
app.use(morgan('combined', { stream: logger.stream }));

// ─── Body parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

// ─── Central error handler (must be last) ────────────────────────────────────
app.use(errorHandler);

module.exports = app;
