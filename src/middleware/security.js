const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Rate limiting middleware to prevent abuse
 */
const createRateLimiter = () => {
    return rateLimit({
        windowMs: config.security.rateLimitWindow,
        max: config.security.rateLimitMax,
        message: {
            error: 'Too many requests',
            message: 'You have exceeded the rate limit. Please try again later.',
            retryAfter: Math.ceil(config.security.rateLimitWindow / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                path: req.path,
                method: req.method
            });
            res.status(429).json({
                error: 'Too many requests',
                message: 'You have exceeded the rate limit. Please try again later.'
            });
        }
    });
};

/**
 * AI-specific rate limiter (more restrictive for expensive operations)
 */
const createAIRateLimiter = () => {
    return rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 20, // 20 requests per minute
        message: {
            error: 'AI rate limit exceeded',
            message: 'Too many AI requests. Please wait before sending more requests.'
        },
        skipSuccessfulRequests: false,
        handler: (req, res) => {
            logger.warn('AI rate limit exceeded', {
                ip: req.ip,
                path: req.path
            });
            res.status(429).json({
                error: 'AI rate limit exceeded',
                message: 'Too many AI requests. Please wait before sending more requests.'
            });
        }
    });
};

/**
 * CORS configuration
 */
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // In development, allow all origins
        if (config.server.isDevelopment) {
            return callback(null, true);
        }

        // In production, check whitelist
        if (config.security.corsOrigins.includes('*') || config.security.corsOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn('CORS origin blocked', { origin });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

/**
 * Security headers middleware using Helmet
 */
const securityHeaders = () => {
    return helmet({
        contentSecurityPolicy: config.server.isProduction ? {
            directives: config.security.csp.directives
        } : false,
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        },
        noSniff: true,
        xssFilter: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    });
};

/**
 * Input sanitization middleware
 */
const sanitizeInputs = () => {
    return (req, res, next) => {
        // Sanitize request body
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }

        // Sanitize URL parameters
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }

        next();
    };
};

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        // Skip keys that look like MongoDB operators
        if (key.startsWith('$')) {
            logger.warn('Potential NoSQL injection attempt detected', { key });
            continue;
        }

        sanitized[key] = sanitizeObject(value);
    }

    return sanitized;
}

/**
 * Request validation middleware
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            logger.warn('Request validation failed', {
                path: req.path,
                errors
            });

            return res.status(400).json({
                error: 'Validation error',
                message: 'Request validation failed',
                details: errors
            });
        }

        req.body = value;
        next();
    };
};

/**
 * API key validation middleware
 */
const validateApiKey = (req, res, next) => {
    if (!config.xai.apiKey) {
        logger.error('XAI API key not configured');
        return res.status(503).json({
            error: 'Service unavailable',
            message: 'AI service is not properly configured'
        });
    }
    next();
};

module.exports = {
    rateLimiter: createRateLimiter(),
    aiRateLimiter: createAIRateLimiter(),
    cors: cors(corsOptions),
    securityHeaders: securityHeaders(),
    mongoSanitize: mongoSanitize(),
    xssClean: xss(),
    sanitizeInputs: sanitizeInputs(),
    validateRequest,
    validateApiKey
};
