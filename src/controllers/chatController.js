const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Get all chat sessions
 */
const getChatSessions = asyncHandler(async (req, res) => {
    logger.info('Fetching chat sessions');

    const sessions = await databaseService.getChatSessions();

    res.json({ sessions });
});

/**
 * Get a specific chat session
 */
const getChatSession = asyncHandler(async (req, res) => {
    const sessionId = parseInt(req.params.sessionId, 10);

    logger.info('Fetching chat session', { sessionId });

    const session = await databaseService.getChatSession(sessionId);

    res.json(session);
});

/**
 * Create or update chat message
 */
const saveChatMessage = asyncHandler(async (req, res) => {
    const { sessionId, userMessage, aiResponse, hasImages } = req.body;

    logger.info('Saving chat message', { sessionId: sessionId || 'new' });

    const result = await databaseService.saveChatMessage({
        sessionId,
        userMessage,
        aiResponse,
        hasImages
    });

    res.json({
        success: true,
        ...result
    });
});

/**
 * Delete a chat session
 */
const deleteChatSession = asyncHandler(async (req, res) => {
    const sessionId = parseInt(req.params.sessionId, 10);

    logger.info('Deleting chat session', { sessionId });

    await databaseService.deleteChatSession(sessionId);

    res.json({
        success: true,
        message: 'Session deleted successfully'
    });
});

module.exports = {
    getChatSessions,
    getChatSession,
    saveChatMessage,
    deleteChatSession
};
