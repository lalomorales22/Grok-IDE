/**
 * Streaming Controller
 * Handles streaming AI responses
 */

const aiService = require('../services/aiService');
const logger = require('../utils/logger');

/**
 * Stream AI completion
 */
exports.streamCompletion = async (req, res) => {
    const { message, context, mode, model, conversationHistory } = req.body;

    try {
        // Set headers for SSE (Server-Sent Events)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Build prompt based on mode
        let prompt = message;
        if (context) {
            prompt = `Context:\n\`\`\`\n${context}\n\`\`\`\n\n${message}`;
        }

        // Add mode-specific instructions
        const modeInstructions = {
            'code': 'You are a code assistant. Provide code examples and explanations.',
            'review': 'You are a code reviewer. Analyze the code for issues, bugs, and improvements.',
            'chat': 'You are a helpful assistant.',
            'image': 'You are assisting with image generation descriptions.'
        };

        if (modeInstructions[mode]) {
            prompt = `${modeInstructions[mode]}\n\n${prompt}`;
        }

        // Build messages array
        const messages = [];

        // Add conversation history
        if (conversationHistory && conversationHistory.length > 0) {
            messages.push(...conversationHistory);
        }

        // Add current message
        messages.push({ role: 'user', content: prompt });

        // Stream response
        await aiService.streamCompletion(
            messages,
            model || 'grok-beta',
            (chunk) => {
                res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            }
        );

        // Send completion marker
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        logger.error('Streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
};
