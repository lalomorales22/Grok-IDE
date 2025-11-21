const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Custom error class for API errors
 */
class APIError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error response formatter
 */
const formatErrorResponse = (error, includeStack = false) => {
    const response = {
        error: error.name || 'Error',
        message: error.message || 'An unexpected error occurred',
        timestamp: error.timestamp || new Date().toISOString()
    };

    if (error.statusCode) {
        response.statusCode = error.statusCode;
    }

    if (includeStack && error.stack) {
        response.stack = error.stack;
    }

    if (error.details) {
        response.details = error.details;
    }

    return response;
};

/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
    const error = new APIError(
        `Cannot ${req.method} ${req.path}`,
        404
    );

    logger.warn('Route not found', {
        method: req.method,
        path: req.path,
        ip: req.ip
    });

    res.status(404).json(formatErrorResponse(error));
};

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log the error
    const logData = {
        message: err.message,
        statusCode: err.statusCode || 500,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
    };

    if (err.statusCode && err.statusCode < 500) {
        logger.warn('Client error', logData);
    } else {
        logger.error('Server error', {
            ...logData,
            stack: err.stack
        });
    }

    // Don't leak error details in production
    const isDevelopment = config.server.isDevelopment;
    const statusCode = err.statusCode || 500;

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Request validation failed',
            details: err.details || err.message
        });
    }

    if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication failed'
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid Input',
            message: 'Invalid data format'
        });
    }

    // Handle axios errors from AI API
    if (err.response && err.response.status) {
        const aiError = handleAIError(err);
        return res.status(aiError.statusCode).json(formatErrorResponse(aiError, isDevelopment));
    }

    // Handle database errors
    if (err.code && err.code.startsWith('SQLITE')) {
        const dbError = new APIError('Database operation failed', 500);
        return res.status(500).json(formatErrorResponse(dbError, isDevelopment));
    }

    // Default error response
    const response = formatErrorResponse(err, isDevelopment);

    // Don't expose internal error messages in production
    if (!isDevelopment && statusCode === 500) {
        response.message = 'An internal server error occurred';
        delete response.stack;
    }

    res.status(statusCode).json(response);
};

/**
 * Handle AI API specific errors
 */
const handleAIError = (error) => {
    if (!error.response) {
        return new APIError('AI service unavailable', 503);
    }

    const { status, data } = error.response;

    switch (status) {
        case 400:
            return new APIError(
                data.error?.message || 'Invalid request to AI service',
                400
            );
        case 401:
            return new APIError('Invalid API key', 401);
        case 403:
            return new APIError('Access forbidden', 403);
        case 413:
            return new APIError('Request too large. Try reducing the input size.', 413);
        case 429:
            return new APIError('Rate limit exceeded. Please try again later.', 429);
        case 500:
        case 502:
        case 503:
            return new APIError('AI service temporarily unavailable', 503);
        default:
            return new APIError(
                data.error?.message || 'AI service error',
                status
            );
    }
};

/**
 * Process termination error handlers
 */
const setupProcessErrorHandlers = () => {
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Promise Rejection', {
            reason: reason,
            promise: promise
        });

        // In production, you might want to gracefully shutdown
        if (config.server.isProduction) {
            process.exit(1);
        }
    });

    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception', {
            message: error.message,
            stack: error.stack
        });

        // Gracefully shutdown
        process.exit(1);
    });
};

module.exports = {
    APIError,
    asyncHandler,
    notFoundHandler,
    errorHandler,
    setupProcessErrorHandlers
};
