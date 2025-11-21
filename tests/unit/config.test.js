/**
 * Unit tests for configuration module
 */

describe('Configuration', () => {
    beforeEach(() => {
        // Clear require cache to get fresh config
        jest.resetModules();
    });

    test('should load default configuration values', () => {
        process.env.SKIP_ENV_VALIDATION = 'true';
        const config = require('../../src/config/config');

        expect(config.server).toBeDefined();
        expect(config.xai).toBeDefined();
        expect(config.database).toBeDefined();
        expect(config.security).toBeDefined();
    });

    test('should use PORT environment variable', () => {
        process.env.PORT = '4000';
        process.env.SKIP_ENV_VALIDATION = 'true';
        const config = require('../../src/config/config');

        expect(config.server.port).toBe(4000);
    });

    test('should detect production environment', () => {
        process.env.NODE_ENV = 'production';
        process.env.SKIP_ENV_VALIDATION = 'true';
        const config = require('../../src/config/config');

        expect(config.server.isProduction).toBe(true);
        expect(config.server.isDevelopment).toBe(false);
    });

    test('should detect development environment', () => {
        process.env.NODE_ENV = 'development';
        process.env.SKIP_ENV_VALIDATION = 'true';
        const config = require('../../src/config/config');

        expect(config.server.isDevelopment).toBe(true);
        expect(config.server.isProduction).toBe(false);
    });

    test('config objects should be frozen', () => {
        process.env.SKIP_ENV_VALIDATION = 'true';
        const config = require('../../src/config/config');

        expect(Object.isFrozen(config)).toBe(true);
        expect(Object.isFrozen(config.server)).toBe(true);
        expect(Object.isFrozen(config.xai)).toBe(true);
    });
});
