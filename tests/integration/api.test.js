/**
 * Integration tests for API endpoints
 */

const request = require('supertest');

// Mock the logger to avoid console output during tests
jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    stream: { write: jest.fn() }
}));

// Mock database service
jest.mock('../../src/services/databaseService', () => ({
    initialize: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true),
    getChatSessions: jest.fn().mockResolvedValue([]),
    getChatSession: jest.fn().mockResolvedValue({ id: 1, messages: [] }),
    saveChatMessage: jest.fn().mockResolvedValue({ messageId: 1, sessionId: 1 })
}));

// Set test environment variables
process.env.SKIP_ENV_VALIDATION = 'true';
process.env.NODE_ENV = 'test';
process.env.XAI_API_KEY = 'test_api_key';

describe('API Endpoints', () => {
    let app;

    beforeAll(() => {
        app = require('../../server-new');
    });

    describe('GET /api/health', () => {
        test('should return health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('features');
            expect(response.body.status).toBe('SYSTEM ONLINE');
        });
    });

    describe('GET /api/chat-history', () => {
        test('should return chat sessions', async () => {
            const response = await request(app)
                .get('/api/chat-history')
                .expect(200);

            expect(response.body).toHaveProperty('sessions');
            expect(Array.isArray(response.body.sessions)).toBe(true);
        });
    });

    describe('POST /api/chat-history', () => {
        test('should save chat message successfully', async () => {
            const chatMessage = {
                userMessage: 'Test message',
                aiResponse: 'Test response',
                hasImages: false
            };

            const response = await request(app)
                .post('/api/chat-history')
                .send(chatMessage)
                .expect(200);

            expect(response.body).toHaveProperty('success');
            expect(response.body.success).toBe(true);
        });

        test('should return validation error for missing fields', async () => {
            const response = await request(app)
                .post('/api/chat-history')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('404 Handler', () => {
        test('should return 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/api/non-existent-route')
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Rate Limiting', () => {
        test('should accept requests under rate limit', async () => {
            await request(app)
                .get('/api/health')
                .expect(200);
        });
    });
});
