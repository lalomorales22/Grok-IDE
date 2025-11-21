const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const config = {
    // Server Configuration
    server: {
        port: parseInt(process.env.PORT, 10) || 3000,
        env: process.env.NODE_ENV || 'development',
        isDevelopment: process.env.NODE_ENV !== 'production',
        isProduction: process.env.NODE_ENV === 'production'
    },

    // xAI API Configuration
    xai: {
        apiKey: process.env.XAI_API_KEY,
        baseURL: process.env.XAI_BASE_URL || 'https://api.x.ai/v1',
        timeout: parseInt(process.env.XAI_TIMEOUT, 10) || 120000,
        retries: parseInt(process.env.XAI_RETRIES, 10) || 3,
        models: {
            chat: process.env.XAI_CHAT_MODEL || 'grok-4-0709',
            vision: process.env.XAI_VISION_MODEL || 'grok-vision-beta',
            image: process.env.XAI_IMAGE_MODEL || 'grok-2-image'
        }
    },

    // Database Configuration
    database: {
        filename: process.env.DB_FILENAME || './grok_ide_chat_history.db',
        verbose: process.env.DB_VERBOSE === 'true'
    },

    // Security Configuration
    security: {
        corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000, // 15 minutes
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
        maxRequestSize: process.env.MAX_REQUEST_SIZE || '50mb',
        csp: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
                connectSrc: ["'self'", 'https://api.x.ai'],
                fontSrc: ["'self'", 'data:'],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        }
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json'
    },

    // AI Request Configuration
    ai: {
        defaultTemperature: parseFloat(process.env.AI_DEFAULT_TEMPERATURE) || 0.7,
        defaultMaxTokens: parseInt(process.env.AI_DEFAULT_MAX_TOKENS, 10) || 8000,
        streamingEnabled: process.env.AI_STREAMING_ENABLED !== 'false'
    },

    // Development Server Configuration
    devServer: {
        defaultPort: parseInt(process.env.DEV_SERVER_PORT, 10) || 8080,
        phpPort: parseInt(process.env.PHP_SERVER_PORT, 10) || 8081
    }
};

// Validation: Check required environment variables
const requiredEnvVars = ['XAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0 && !process.env.SKIP_ENV_VALIDATION) {
    console.warn(`[CONFIG WARNING] Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.warn('[CONFIG WARNING] Some features may not work correctly');
}

// Freeze config to prevent accidental modifications
Object.freeze(config);
Object.freeze(config.server);
Object.freeze(config.xai);
Object.freeze(config.database);
Object.freeze(config.security);
Object.freeze(config.logging);
Object.freeze(config.ai);
Object.freeze(config.devServer);

module.exports = config;
