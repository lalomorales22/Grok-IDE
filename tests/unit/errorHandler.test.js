/**
 * Unit tests for error handling middleware
 */

const { APIError, asyncHandler } = require('../../src/middleware/errorHandler');

describe('APIError', () => {
    test('should create an APIError with default values', () => {
        const error = new APIError('Test error');

        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(500);
        expect(error.isOperational).toBe(true);
        expect(error.timestamp).toBeDefined();
    });

    test('should create an APIError with custom status code', () => {
        const error = new APIError('Not found', 404);

        expect(error.message).toBe('Not found');
        expect(error.statusCode).toBe(404);
    });

    test('should capture stack trace', () => {
        const error = new APIError('Test error');

        expect(error.stack).toBeDefined();
        expect(typeof error.stack).toBe('string');
        expect(error.stack.length).toBeGreaterThan(0);
    });
});

describe('asyncHandler', () => {
    test('should handle async function successfully', async () => {
        const mockFn = jest.fn().mockResolvedValue('success');
        const handler = asyncHandler(mockFn);

        const req = {};
        const res = {};
        const next = jest.fn();

        await handler(req, res, next);

        expect(mockFn).toHaveBeenCalledWith(req, res, next);
        expect(next).not.toHaveBeenCalled();
    });

    test('should catch async errors and pass to next', async () => {
        const error = new Error('Async error');
        const mockFn = jest.fn().mockRejectedValue(error);
        const handler = asyncHandler(mockFn);

        const req = {};
        const res = {};
        const next = jest.fn();

        await handler(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });

    test('should handle synchronous errors', async () => {
        const testError = { message: 'Test sync error', name: 'Error' };
        const mockFn = jest.fn().mockRejectedValue(testError);
        const handler = asyncHandler(mockFn);

        const req = {};
        const res = {};
        const next = jest.fn();

        await handler(req, res, next);

        expect(next).toHaveBeenCalledWith(testError);
    });
});
