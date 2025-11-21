const AIService = require('../services/aiService');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * AI Completion endpoint
 */
const createCompletion = asyncHandler(async (req, res) => {
    const { messages, temperature, max_tokens, stream } = req.body;

    logger.info('AI completion request received', {
        messageCount: messages.length,
        stream
    });

    const result = await AIService.createCompletion({
        messages,
        temperature,
        maxTokens: max_tokens,
        stream
    });

    // Handle streaming response
    if (stream && result.data) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        let buffer = '';
        let streamEnded = false;

        const streamTimeout = setTimeout(() => {
            if (!streamEnded) {
                logger.warn('Stream timeout, ending connection');
                streamEnded = true;
                if (!res.headersSent) {
                    res.end();
                }
            }
        }, 30000);

        result.data.on('data', (chunk) => {
            if (streamEnded) return;

            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '') continue;
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data.trim() === '[DONE]') {
                        clearTimeout(streamTimeout);
                        streamEnded = true;
                        res.write('data: [DONE]\n\n');
                        res.end();
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        res.write(`data: ${JSON.stringify(parsed)}\n\n`);
                    } catch (e) {
                        logger.error('Failed to parse streaming chunk', { error: e.message });
                    }
                }
            }
        });

        result.data.on('end', () => {
            clearTimeout(streamTimeout);
            if (!streamEnded) {
                streamEnded = true;
                res.write('data: [DONE]\n\n');
                res.end();
            }
        });

        result.data.on('error', (error) => {
            clearTimeout(streamTimeout);
            logger.error('Streaming error', { error: error.message });
            if (!streamEnded) {
                streamEnded = true;
                res.end();
            }
        });
    } else {
        // Non-streaming response
        res.json(result);
    }
});

/**
 * Generate image endpoint
 */
const generateImage = asyncHandler(async (req, res) => {
    const { prompt, n, response_format } = req.body;

    logger.info('Image generation request received');

    const result = await AIService.generateImage({
        prompt,
        n,
        responseFormat: response_format
    });

    res.json(result);
});

/**
 * Code analysis endpoint
 */
const analyzeCode = asyncHandler(async (req, res) => {
    const { code, language, analysisType, context } = req.body;

    logger.info('Code analysis request received', { language, analysisType });

    const result = await AIService.analyzeCode({
        code,
        language,
        analysisType,
        context
    });

    res.json(result);
});

/**
 * Project analysis endpoint
 */
const analyzeProject = asyncHandler(async (req, res) => {
    const { fileStructure, projectType, fileContents } = req.body;

    logger.info('Project analysis request received', { projectType });

    const result = await AIService.analyzeProject({
        fileStructure,
        projectType,
        fileContents
    });

    res.json(result);
});

/**
 * Image analysis endpoint
 */
const analyzeImage = asyncHandler(async (req, res) => {
    const { imageData, prompt } = req.body;

    logger.info('Image analysis request received');

    const result = await AIService.analyzeImage({
        imageData,
        prompt
    });

    res.json(result);
});

/**
 * Smart code insertion endpoint
 */
const smartInsert = asyncHandler(async (req, res) => {
    const { currentContent, codeToInsert, fileName, language } = req.body;

    logger.info('Smart insert request received', { fileName });

    const result = await AIService.smartInsert({
        currentContent,
        codeToInsert,
        fileName,
        language
    });

    res.json(result);
});

module.exports = {
    createCompletion,
    generateImage,
    analyzeCode,
    analyzeProject,
    analyzeImage,
    smartInsert
};
