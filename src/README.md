# Grok IDE - Source Code Architecture

## 📁 Directory Structure

```
src/
├── config/          # Configuration management
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/          # Data models (future use)
├── routes/          # API route definitions
├── services/        # Business logic services
└── utils/           # Utility functions and helpers
```

## 🏗️ Architecture Overview

### Config (`config/`)
- **config.js**: Centralized configuration management with environment variable validation

### Controllers (`controllers/`)
- **aiController.js**: Handles AI-related API endpoints
- **chatController.js**: Manages chat history operations

### Middleware (`middleware/`)
- **security.js**: Security middleware including:
  - Rate limiting
  - CORS configuration
  - Helmet security headers
  - Input sanitization
  - XSS protection
  - Request validation
- **errorHandler.js**: Centralized error handling with:
  - Custom APIError class
  - Async error wrapper
  - Global error handler
  - 404 handler

### Routes (`routes/`)
- **api.js**: API route definitions with middleware integration

### Services (`services/`)
- **aiService.js**: AI operations including:
  - Chat completions (streaming & non-streaming)
  - Image generation
  - Code analysis
  - Project analysis
  - Image analysis
  - Smart code insertion
- **databaseService.js**: Database operations for:
  - Chat session management
  - Message persistence
  - Query helpers

### Utils (`utils/`)
- **logger.js**: Winston-based logging system
- **validation.js**: Joi validation schemas for all API endpoints

## 🔒 Security Features

### Implemented Security Measures
1. **Rate Limiting**: Prevents API abuse
   - General API: 100 requests per 15 minutes
   - AI endpoints: 20 requests per minute

2. **Input Sanitization**:
   - NoSQL injection prevention
   - XSS protection
   - Request validation with Joi schemas

3. **Security Headers** (Helmet):
   - Content Security Policy (CSP)
   - HTTP Strict Transport Security (HSTS)
   - X-Frame-Options
   - X-Content-Type-Options

4. **CORS**: Configurable cross-origin resource sharing

5. **Request Size Limits**: Prevents payload attacks (default: 50MB)

## 📝 Error Handling

### Error Flow
1. Errors are thrown as `APIError` instances with status codes
2. Async errors are caught by `asyncHandler` wrapper
3. All errors flow through the global error handler
4. Errors are logged with Winston
5. Sanitized error responses sent to client

### Error Types
- **400**: Validation errors
- **401**: Authentication errors
- **404**: Not found errors
- **429**: Rate limit exceeded
- **500**: Internal server errors
- **503**: Service unavailable (AI API issues)

## 📊 Logging

### Log Levels
- **error**: System errors and exceptions
- **warn**: Warning messages
- **info**: General information (default)
- **debug**: Debugging information
- **verbose**: Detailed information

### Log Outputs
- Console (development)
- File: `logs/combined.log` (all logs)
- File: `logs/error.log` (errors only)
- File: `logs/exceptions.log` (uncaught exceptions)
- File: `logs/rejections.log` (unhandled promise rejections)

## 🧪 Testing

### Test Structure
```
tests/
├── unit/            # Unit tests for individual modules
└── integration/     # Integration tests for API endpoints
```

### Running Tests
```bash
npm test                # Run all tests with coverage
npm run test:watch      # Watch mode
npm run test:unit       # Unit tests only
npm run test:integration # Integration tests only
```

## 🚀 Performance Optimizations

1. **Compression**: Gzip compression for responses
2. **Request Parsing**: Configurable size limits
3. **Connection Pooling**: Efficient database connections
4. **Caching**: HTTP caching headers
5. **Lazy Loading**: Services loaded on demand

## 🔧 Configuration

All configuration is managed through environment variables:

```env
# Server
PORT=3000
NODE_ENV=development

# xAI API
XAI_API_KEY=your_api_key

# Security
CORS_ORIGINS=*
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
```

See `.env.example` for full configuration options.

## 📦 Dependencies

### Production
- **express**: Web framework
- **axios**: HTTP client for AI API
- **winston**: Logging
- **helmet**: Security headers
- **joi**: Validation
- **express-rate-limit**: Rate limiting
- **cors**: CORS middleware
- **compression**: Response compression

### Development
- **jest**: Testing framework
- **supertest**: HTTP testing
- **nodemon**: Development server
- **eslint**: Code linting

## 🎯 Best Practices

1. **Separation of Concerns**: Each module has a single responsibility
2. **Error Handling**: All async operations use asyncHandler
3. **Validation**: All inputs validated before processing
4. **Logging**: Comprehensive logging for debugging
5. **Security**: Multiple layers of security middleware
6. **Testing**: Unit and integration tests for core functionality

## 🔄 Migration from Legacy

The old monolithic `server.js` (1860 lines) has been refactored into:
- 10+ modular files
- Clear separation of concerns
- Improved maintainability
- Better testability
- Enhanced security

To run the old server: `npm run start:old`

## 📚 Further Reading

- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Joi Validation](https://joi.dev/api/)
