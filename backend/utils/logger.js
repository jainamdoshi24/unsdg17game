/**
 * Structured logger using Winston.
 * Usage: const logger = require('../utils/logger');
 *        logger.info('message', { key: 'value' });
 *        logger.error('failed', { err: error.message });
 */
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, errors, json, colorize, printf } = format;

const isDev = process.env.NODE_ENV !== 'production';

// ── Development format: human-readable ────────────────────────────────────────
const devFormat = combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp: ts, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${ts} [${level}] ${message}${metaStr}`;
    })
);

// ── Production format: structured JSON (for log aggregators) ─────────────────
const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
);

const logger = createLogger({
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
    format: isDev ? devFormat : prodFormat,
    transports: [
        new transports.Console(),
    ],
    // Don't exit on handled exceptions
    exitOnError: false,
    // Silently pass through test environment
    silent: process.env.NODE_ENV === 'test',
});

// ── Convenience: log an incoming HTTP request ─────────────────────────────────
logger.request = (req) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        ua: req.headers['user-agent']?.slice(0, 80),
    });
};

// ── Convenience: log an error with request context ───────────────────────────
logger.requestError = (req, err, context = {}) => {
    logger.error(err.message, {
        method: req.method,
        path: req.path,
        status: err.status || 500,
        stack: isDev ? err.stack : undefined,
        ...context,
    });
};

module.exports = logger;
