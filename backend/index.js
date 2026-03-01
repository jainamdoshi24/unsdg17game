const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const logger = require('./utils/logger');
require('dotenv').config(); // loads backend/.env


// ── Security: Enforce required env vars ────────────────────────────
if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET environment variable is not set.');
    console.error('   Set it in your .env file before starting the server.');
    process.exit(1);
}

// ── Route Imports ──────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const missionRoutes = require('./routes/missions');
const progressRoutes = require('./routes/progress');
const leaderboardRoutes = require('./routes/leaderboard');
const analyticsRoutes = require('./routes/analytics');
const questionRoutes = require('./routes/questions');
const simulationRoutes = require('./routes/simulation');
const quizRoutes = require('./routes/quiz');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ────────────────────────────────────────────
// HTTP security headers (XSS, clickjacking, HSTS, etc.)
app.use(helmet());

// CORS — development allows both Vite ports, production restrict to domain
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Body parsing (10kb limit stops large payload attacks)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB injection prevention — replaceWith:'_' mutates object values in-place
// instead of replacing the whole req.query object (which is read-only in Node 18+)
// app.use(mongoSanitize({ replaceWith: '_' }));

// ── Rate Limiting ──────────────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,                   // 300 requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,                    // Strict: 20 login/register attempts per 15min
    message: { error: 'Too many auth attempts, please try again in 15 minutes.' },
    skipSuccessfulRequests: true,
});

const simLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,                   // 120 sim actions/minute per IP
    message: { error: 'Simulation rate limit exceeded.' },
});

app.use(globalLimiter);

// Request logger (structured, skips test env)
app.use((req, _res, next) => {
    logger.request(req);
    next();
});

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/sim', simLimiter, simulationRoutes);
app.use('/api/quiz', quizRoutes);

// Health check
app.get('/health', (_req, res) => res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
}));

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler — hide stack in production
app.use((err, _req, res, _next) => {
    const isDev = process.env.NODE_ENV !== 'production';
    logger.error(err.message, { stack: isDev ? err.stack : undefined, status: err.status });
    res.status(err.status || 500).json({
        error: isDev ? err.message : 'Internal server error',
    });
});

// ── Database Connection ────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URL;

if (!MONGO_URI) {
    console.error('❌ MONGODB_URL is not set in .env');
    process.exit(1);
}

mongoose
    .connect(MONGO_URI, {
        dbName: 'sdg_quest',
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
        logger.info('MongoDB connected — sdg_quest database');
        const PORT = process.env.PORT || 5000;
        const server = app.listen(PORT, () => {
            logger.info(`SDG Quest Backend running on port ${PORT}`);
        });

        // Graceful shutdown
        const shutdown = (signal) => {
            console.log(`\n${signal} received — shutting down...`);
            server.close(() => {
                mongoose.connection.close(false, () => {
                    console.log('MongoDB connection closed.');
                    process.exit(0);
                });
            });
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    })
    .catch((err) => {
        logger.error('MongoDB connection failed', { message: err.message });
        process.exit(1);
    });
