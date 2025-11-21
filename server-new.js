/**
 * Grok IDE Server - Refactored Architecture
 * Version 3.0.0 - Phase 1 Complete
 *
 * This is a modernized, modular version of the Grok IDE server
 * with improved security, error handling, logging, and architecture
 */

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const compression = require('compression');

// Import configuration and utilities
const config = require('./src/config/config');
const logger = require('./src/utils/logger');
const databaseService = require('./src/services/databaseService');

// Import middleware
const security = require('./src/middleware/security');
const { errorHandler, notFoundHandler, setupProcessErrorHandlers } = require('./src/middleware/errorHandler');

// Import routes
const apiRoutes = require('./src/routes/api');

// For terminal functionality (to be refactored later)
const { execSync, spawn } = require('child_process');
const fs = require('fs');

// Initialize Express app
const app = express();

// Trust proxy for accurate IP addresses behind reverse proxies
app.set('trust proxy', 1);

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Compression middleware
app.use(compression());

// Security headers
app.use(security.securityHeaders);

// CORS
app.use(security.cors);

// HTTP request logging
if (config.server.isDevelopment) {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', { stream: logger.stream }));
}

// Body parsers with size limits
app.use(express.json({
    limit: config.security.maxRequestSize
}));
app.use(express.urlencoded({
    limit: config.security.maxRequestSize,
    extended: true
}));

// Input sanitization
app.use(security.sanitizeInputs);
app.use(security.mongoSanitize);
app.use(security.xssClean);

// Rate limiting
app.use('/api', security.rateLimiter);

// ============================================================================
// STATIC FILES
// ============================================================================

// Serve static files from public directory
app.use(express.static('public'));

// Serve files from current working directory for terminal browser access
app.use('/serve', express.static('.'));

// ============================================================================
// ROUTES
// ============================================================================

// Main route - serve Grok IDE interface (Phase 2)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'GrokIDE-v2.html'));
});

// Phase 2 route
app.get('/v2', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'GrokIDE-v2.html'));
});

// Legacy Phase 1 route
app.get('/v1', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'GrokIDE.html'));
});

// Alternative IDE route (Phase 2)
app.get('/ide', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'GrokIDE-v2.html'));
});

// API routes
app.use('/api', apiRoutes);

// ============================================================================
// TERMINAL AND SERVER MANAGEMENT (Legacy - to be refactored)
// ============================================================================

// Track active development servers
let activeServers = new Map();

// Terminal command endpoint
app.post('/api/terminal', (req, res) => {
    const { command, cwd = '.' } = req.body;

    if (!command) {
        return res.status(400).json({
            success: false,
            error: 'Command is required'
        });
    }

    logger.info('Terminal command executed', { command, cwd });

    try {
        const args = command.split(' ');
        const cmd = args[0];
        const params = args.slice(1);

        // Handle built-in terminal commands (same as before)
        switch (cmd) {
            case 'help':
                res.json({
                    success: true,
                    output: `Available commands:
ls            - List directory contents
cd <dir>      - Change directory
pwd           - Show current directory
mkdir <dir>   - Create directory
touch <file>  - Create empty file
cat <file>    - Display file contents
echo <text>   - Echo text
clear         - Clear terminal
help          - Show this help`,
                    cwd: cwd
                });
                break;

            case 'clear':
                res.json({
                    success: true,
                    action: 'clear',
                    cwd: cwd
                });
                break;

            case 'pwd':
                const absolutePath = path.resolve(cwd);
                res.json({
                    success: true,
                    output: absolutePath,
                    cwd: cwd
                });
                break;

            default:
                // Execute system commands
                try {
                    const options = {
                        cwd: path.resolve(cwd),
                        encoding: 'utf8',
                        timeout: 10000,
                        maxBuffer: 1024 * 1024
                    };

                    const output = execSync(command, options);
                    res.json({
                        success: true,
                        output: output.toString().trim(),
                        cwd: cwd
                    });
                } catch (error) {
                    res.json({
                        success: false,
                        error: error.message || 'Command execution failed'
                    });
                }
                break;
        }
    } catch (error) {
        logger.error('Terminal command failed', { error: error.message });
        res.json({
            success: false,
            error: 'Terminal command failed: ' + error.message
        });
    }
});

// Development server endpoints
app.post('/api/start-dev-server', (req, res) => {
    // Legacy endpoint - to be refactored
    res.json({ success: true, message: 'Dev server functionality available' });
});

app.post('/api/start-php-server', (req, res) => {
    // Legacy endpoint - to be refactored
    res.json({ success: true, message: 'PHP server functionality available' });
});

app.post('/api/execute-python', async (req, res) => {
    // Legacy endpoint - to be refactored
    res.json({ success: true, message: 'Python execution functionality available' });
});

app.post('/api/execute-node', async (req, res) => {
    // Legacy endpoint - to be refactored
    res.json({ success: true, message: 'Node execution functionality available' });
});

app.post('/api/stop-servers', (req, res) => {
    // Stop all active servers
    for (const [key, server] of activeServers) {
        try {
            if (server.kill) {
                server.kill();
            } else if (server.close) {
                server.close();
            }
        } catch (error) {
            logger.error('Error stopping server', { key, error: error.message });
        }
    }
    activeServers.clear();
    res.json({ success: true, message: 'All servers stopped' });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

/**
 * Start the server
 */
async function startServer() {
    try {
        // Setup process error handlers
        setupProcessErrorHandlers();

        // Initialize database
        await databaseService.initialize();
        logger.info('Database initialized successfully');

        // Start Express server
        const server = app.listen(config.server.port, () => {
            logger.info(`
╔══════════════════════════════════════════════════════════════╗
║                      GROK IDE SERVER                         ║
║                         SYSTEM ONLINE                        ║
║                        VERSION 3.0.0                         ║
╠══════════════════════════════════════════════════════════════╣
║  Server:          http://localhost:${config.server.port.toString().padEnd(30)}║
║  Environment:     ${config.server.env.toUpperCase().padEnd(42)}║
║  AI Features:     ${(config.xai.apiKey ? 'ENABLED' : 'DISABLED').padEnd(42)}║
║  Logging:         ${config.logging.level.toUpperCase().padEnd(42)}║
║  Status:          READY FOR OPERATIONS                       ║
╚══════════════════════════════════════════════════════════════╝
            `);
        });

        // Graceful shutdown handlers
        const gracefulShutdown = async (signal) => {
            logger.info(`${signal} received, shutting down gracefully...`);

            // Stop accepting new connections
            server.close(async () => {
                logger.info('HTTP server closed');

                // Stop active dev servers
                for (const [key, activeServer] of activeServers) {
                    try {
                        if (activeServer.kill) {
                            activeServer.kill();
                        } else if (activeServer.close) {
                            activeServer.close();
                        }
                    } catch (error) {
                        logger.error('Error stopping server during shutdown', { key });
                    }
                }
                activeServers.clear();

                // Close database
                try {
                    await databaseService.close();
                    logger.info('Database connection closed');
                } catch (error) {
                    logger.error('Error closing database', { error: error.message });
                }

                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        logger.error('Failed to start server', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

// Start the server
if (require.main === module) {
    startServer();
}

module.exports = app;
