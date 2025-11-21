const express = require('express');
const aiController = require('../controllers/aiController');
const chatController = require('../controllers/chatController');
const { validateRequest, validateApiKey, aiRateLimiter } = require('../middleware/security');
const {
    completionSchema,
    imageGenerationSchema,
    codeAnalysisSchema,
    projectAnalysisSchema,
    imageAnalysisSchema,
    smartInsertSchema,
    chatMessageSchema
} = require('../utils/validation');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    const config = require('../config/config');
    res.json({
        status: 'SYSTEM ONLINE',
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        features: {
            aiCompletion: !!config.xai.apiKey,
            imageGeneration: !!config.xai.apiKey,
            imageAnalysis: !!config.xai.apiKey,
            codeAnalysis: !!config.xai.apiKey,
            projectAnalysis: !!config.xai.apiKey
        }
    });
});

// AI Endpoints - with rate limiting and API key validation
router.post('/completion',
    aiRateLimiter,
    validateApiKey,
    validateRequest(completionSchema),
    aiController.createCompletion
);

router.post('/generate-image',
    aiRateLimiter,
    validateApiKey,
    validateRequest(imageGenerationSchema),
    aiController.generateImage
);

router.post('/analyze-code',
    aiRateLimiter,
    validateApiKey,
    validateRequest(codeAnalysisSchema),
    aiController.analyzeCode
);

router.post('/analyze-project',
    aiRateLimiter,
    validateApiKey,
    validateRequest(projectAnalysisSchema),
    aiController.analyzeProject
);

router.post('/analyze-image',
    aiRateLimiter,
    validateApiKey,
    validateRequest(imageAnalysisSchema),
    aiController.analyzeImage
);

router.post('/smart-insert',
    aiRateLimiter,
    validateApiKey,
    validateRequest(smartInsertSchema),
    aiController.smartInsert
);

// Chat History Endpoints
router.get('/chat-history', chatController.getChatSessions);
router.get('/chat-history/:sessionId', chatController.getChatSession);
router.post('/chat-history', validateRequest(chatMessageSchema), chatController.saveChatMessage);
router.delete('/chat-history/:sessionId', chatController.deleteChatSession);

// Debug endpoint for development
if (process.env.NODE_ENV !== 'production') {
    router.get('/debug', (req, res) => {
        const config = require('../config/config');
        res.json({
            hasApiKey: !!config.xai.apiKey,
            apiKeyPrefix: config.xai.apiKey ? config.xai.apiKey.substring(0, 10) + '...' : 'Not set',
            timestamp: new Date().toISOString(),
            environment: config.server.env
        });
    });
}

module.exports = router;
