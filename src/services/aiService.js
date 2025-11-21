const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

// Create axios instance for xAI API
const createGrokClient = () => {
    if (!config.xai.apiKey) {
        logger.error('XAI API key not configured');
        return null;
    }

    const client = axios.create({
        baseURL: config.xai.baseURL,
        headers: {
            'Authorization': `Bearer ${config.xai.apiKey}`,
            'Content-Type': 'application/json'
        },
        timeout: config.xai.timeout
    });

    // Add retry logic
    try {
        const axiosRetry = require('axios-retry');
        axiosRetry(client, {
            retries: config.xai.retries,
            retryDelay: (retryCount) => retryCount * 1000,
            retryCondition: (error) => {
                return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                    (error.response?.status >= 500);
            }
        });
        logger.info('Axios retry configured for AI client');
    } catch (err) {
        logger.warn('axios-retry not available, continuing without retry logic');
    }

    return client;
};

const grokClient = createGrokClient();

class AIService {
    /**
     * Chat completion with streaming support
     */
    static async createCompletion({ messages, temperature, maxTokens, stream = true }) {
        if (!grokClient) {
            throw new APIError('AI service not configured', 503);
        }

        try {
            logger.info('Processing AI completion request', {
                messageCount: messages.length,
                temperature,
                maxTokens,
                stream
            });

            const startTime = Date.now();

            // Check if messages contain images
            const hasImages = messages.some(msg =>
                Array.isArray(msg.content) &&
                msg.content.some(item => item.type === 'image_url')
            );

            // Dynamic token adjustment based on payload size
            const payloadSize = JSON.stringify(messages).length;
            let adjustedMaxTokens = maxTokens || config.ai.defaultMaxTokens;

            if (payloadSize > 100000) {
                adjustedMaxTokens = Math.min(adjustedMaxTokens * 2, 16000);
                logger.info('Very large payload detected, increased max_tokens', { maxTokens: adjustedMaxTokens });
            } else if (payloadSize > 50000) {
                adjustedMaxTokens = Math.min(adjustedMaxTokens * 1.5, 12000);
                logger.info('Large payload detected, increased max_tokens', { maxTokens: adjustedMaxTokens });
            }

            const requestConfig = {
                model: hasImages ? config.xai.models.vision : config.xai.models.chat,
                messages: messages,
                temperature: temperature || config.ai.defaultTemperature,
                max_tokens: adjustedMaxTokens,
                stream: stream && config.ai.streamingEnabled
            };

            if (stream && config.ai.streamingEnabled) {
                return await this._handleStreamingResponse(requestConfig);
            } else {
                const response = await grokClient.post('/chat/completions', requestConfig);
                const duration = Date.now() - startTime;
                logger.info('AI completion successful', { duration, model: requestConfig.model });
                return response.data;
            }
        } catch (error) {
            logger.error('AI completion failed', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            throw this._handleAIError(error);
        }
    }

    /**
     * Handle streaming response
     */
    static async _handleStreamingResponse(requestConfig) {
        try {
            const response = await grokClient.post('/chat/completions', requestConfig, {
                responseType: 'stream'
            });

            return response; // Return the stream response
        } catch (error) {
            logger.warn('Streaming failed, falling back to non-streaming', {
                error: error.message
            });

            // Fallback to non-streaming
            const fallbackConfig = { ...requestConfig, stream: false };
            const response = await grokClient.post('/chat/completions', fallbackConfig);
            return response.data;
        }
    }

    /**
     * Stream completion with callback for Phase 3
     */
    static async streamCompletion(messages, model, onChunk) {
        if (!grokClient) {
            throw new APIError('AI service not configured', 503);
        }

        try {
            logger.info('Starting streaming completion', { messageCount: messages.length });

            const response = await grokClient.post('/chat/completions', {
                model: model || config.xai.models.chat,
                messages: messages,
                temperature: config.ai.defaultTemperature,
                max_tokens: config.ai.defaultMaxTokens,
                stream: true
            }, {
                responseType: 'stream'
            });

            return new Promise((resolve, reject) => {
                let fullResponse = '';

                response.data.on('data', (chunk) => {
                    const lines = chunk.toString().split('\n').filter(Boolean);

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);
                                const content = parsed.choices?.[0]?.delta?.content;

                                if (content) {
                                    fullResponse += content;
                                    onChunk(content);
                                }
                            } catch (e) {
                                // Ignore parse errors for streaming chunks
                            }
                        }
                    }
                });

                response.data.on('end', () => {
                    logger.info('Streaming completed', { responseLength: fullResponse.length });
                    resolve(fullResponse);
                });

                response.data.on('error', (error) => {
                    logger.error('Streaming error', { error: error.message });
                    reject(error);
                });
            });

        } catch (error) {
            logger.error('Stream completion failed', { message: error.message });
            throw this._handleAIError(error);
        }
    }

    /**
     * Generate image using xAI
     */
    static async generateImage({ prompt, n = 1, responseFormat = 'url' }) {
        if (!grokClient) {
            throw new APIError('AI service not configured', 503);
        }

        try {
            logger.info('Processing image generation request', { prompt: prompt.substring(0, 50) });

            const response = await grokClient.post('/images/generations', {
                model: config.xai.models.image,
                prompt: prompt,
                n: n,
                response_format: responseFormat
            });

            logger.info('Image generation successful');

            return {
                imageUrl: response.data.data[0].url || response.data.data[0].b64_json,
                prompt: prompt,
                n: n,
                response_format: responseFormat,
                created: Math.floor(Date.now() / 1000),
                data: response.data.data
            };
        } catch (error) {
            logger.error('Image generation failed', {
                message: error.message,
                status: error.response?.status
            });
            throw this._handleAIError(error);
        }
    }

    /**
     * Analyze code with AI
     */
    static async analyzeCode({ code, language, analysisType = 'general', context = '' }) {
        if (!grokClient) {
            throw new APIError('AI service not configured', 503);
        }

        const analysisPrompts = {
            general: 'Analyze this code for potential improvements, bugs, and best practices.',
            security: 'Perform a security analysis of this code, identifying potential vulnerabilities.',
            performance: 'Analyze this code for performance issues and optimization opportunities.',
            style: 'Review this code for style consistency and adherence to best practices.',
            refactor: 'Suggest refactoring opportunities to improve code structure and maintainability.'
        };

        const systemPrompt = `You are a code analysis AI with access to the full project context. ${analysisPrompts[analysisType]}
        Provide specific, actionable feedback with code examples where appropriate.
        Format your response with clear sections and use markdown for code blocks.
        Consider the broader project context when making recommendations.`;

        const userContent = `Language: ${language}

        ${context ? `Project Context:\n${context}\n\n` : ''}

        Code to analyze:
        \`\`\`${language}
        ${code}
        \`\`\``;

        try {
            logger.info('Starting code analysis', { language, analysisType });

            const response = await grokClient.post('/chat/completions', {
                model: config.xai.models.chat,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent }
                ],
                temperature: 0.3,
                max_tokens: 8000
            });

            logger.info('Code analysis completed');

            return {
                analysis: response.data.choices[0].message.content,
                analysisType: analysisType,
                language: language
            };
        } catch (error) {
            logger.error('Code analysis failed', { message: error.message });
            throw this._handleAIError(error);
        }
    }

    /**
     * Analyze project structure
     */
    static async analyzeProject({ fileStructure, projectType, fileContents = {} }) {
        if (!grokClient) {
            throw new APIError('AI service not configured', 503);
        }

        const systemPrompt = `You are a project analysis AI with deep understanding of software architecture patterns.
        Analyze the provided project structure and file contents to provide comprehensive insights about:
        - Architecture and design patterns
        - Code organization and modularity
        - Potential issues and technical debt
        - Security considerations
        - Performance implications
        - Best practices adherence
        - Recommendations for improvement

        Consider the project type: ${projectType || 'general'}.
        Provide actionable recommendations with specific examples.`;

        let analysisContent = `Project Structure:\n${JSON.stringify(fileStructure, null, 2)}`;

        if (Object.keys(fileContents).length > 0) {
            analysisContent += '\n\nKey File Contents:\n';
            Object.entries(fileContents).forEach(([filename, content]) => {
                analysisContent += `\n--- ${filename} ---\n${content}\n`;
            });
        }

        try {
            logger.info('Starting project analysis', { projectType });

            const response = await grokClient.post('/chat/completions', {
                model: config.xai.models.chat,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: analysisContent }
                ],
                temperature: 0.4,
                max_tokens: 8000
            });

            logger.info('Project analysis completed');

            return {
                analysis: response.data.choices[0].message.content,
                projectType: projectType
            };
        } catch (error) {
            logger.error('Project analysis failed', { message: error.message });
            throw this._handleAIError(error);
        }
    }

    /**
     * Analyze image
     */
    static async analyzeImage({ imageData, prompt = 'Analyze this image and describe what you see.' }) {
        if (!grokClient) {
            throw new APIError('AI service not configured', 503);
        }

        try {
            logger.info('Processing image analysis request');

            const response = await grokClient.post('/chat/completions', {
                model: config.xai.models.vision,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: { url: imageData }
                            }
                        ]
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            });

            logger.info('Image analysis completed');

            return {
                analysis: response.data.choices[0].message.content,
                prompt: prompt
            };
        } catch (error) {
            logger.error('Image analysis failed', { message: error.message });
            throw this._handleAIError(error);
        }
    }

    /**
     * Smart code insertion
     */
    static async smartInsert({ currentContent, codeToInsert, fileName, language }) {
        if (!grokClient) {
            throw new APIError('AI service not configured', 503);
        }

        const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
        const detectedLanguage = language || this._getLanguageFromExtension(fileExtension);

        const systemPrompt = `You are an expert code editor AI assistant. Your task is to intelligently insert code into existing files.

CRITICAL INSTRUCTIONS:
1. Analyze the current file content and the code to be inserted
2. Determine the BEST location to insert the code based on:
   - Code structure and organization
   - Similar existing code patterns
   - Language-specific conventions
   - Logical code flow

3. For different file types:
   - HTML: Insert in appropriate sections (head, body, etc.)
   - CSS: Group with similar selectors or add to appropriate sections
   - JavaScript: Place functions with other functions, imports at top, etc.
   - JSON: Maintain proper structure and nesting
   - Other languages: Follow language conventions

4. REPLACEMENT vs INSERTION:
   - If similar code exists, REPLACE it instead of duplicating
   - If code should be added to existing structures, MERGE intelligently
   - If it's completely new, INSERT at the most logical location

5. Return a JSON response with:
   - success: true/false
   - newContent: the complete new file content with code inserted
   - insertionStart: character position where insertion begins
   - insertionEnd: character position where insertion ends
   - message: explanation of what was done
   - strategy: "insert", "replace", or "merge"

Be smart about code organization and maintain clean, readable structure.`;

        const userPrompt = `File: ${fileName}
Language: ${detectedLanguage}

Current file content:
\`\`\`${detectedLanguage}
${currentContent}
\`\`\`

Code to insert:
\`\`\`${detectedLanguage}
${codeToInsert}
\`\`\`

Analyze the file structure and determine the best way to insert this code. Return only a valid JSON response.`;

        try {
            logger.info('Starting smart insertion analysis', { fileName, language: detectedLanguage });

            const response = await grokClient.post('/chat/completions', {
                model: config.xai.models.chat,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.1,
                max_tokens: 8000
            });

            logger.info('Smart insertion analysis completed');

            let aiResponse = response.data.choices[0].message.content.trim();

            // Clean up markdown code blocks
            if (aiResponse.startsWith('```json')) {
                aiResponse = aiResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            } else if (aiResponse.startsWith('```')) {
                aiResponse = aiResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }

            const result = JSON.parse(aiResponse);

            if (!result.success || !result.newContent) {
                throw new Error('Invalid AI response structure');
            }

            return result;
        } catch (error) {
            logger.error('Smart insertion failed', { message: error.message });
            throw this._handleAIError(error);
        }
    }

    /**
     * Helper: Get language from file extension
     */
    static _getLanguageFromExtension(extension) {
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'jsx': 'javascript',
            'tsx': 'typescript',
            'py': 'python',
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'json': 'json',
            'md': 'markdown',
            'sql': 'sql',
            'php': 'php',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'swift': 'swift',
            'kt': 'kotlin'
        };

        return languageMap[extension] || 'text';
    }

    /**
     * Handle AI API errors
     */
    static _handleAIError(error) {
        if (!error.response) {
            return new APIError('AI service unavailable', 503);
        }

        const { status, data } = error.response;

        switch (status) {
            case 400:
                return new APIError(
                    data.error?.message || 'Invalid request to AI service',
                    400
                );
            case 401:
                return new APIError('Invalid API key', 401);
            case 403:
                return new APIError('Access forbidden', 403);
            case 413:
                return new APIError('Request too large. Try reducing the input size.', 413);
            case 429:
                return new APIError('Rate limit exceeded. Please try again later.', 429);
            case 500:
            case 502:
            case 503:
                return new APIError('AI service temporarily unavailable', 503);
            default:
                return new APIError(
                    data.error?.message || 'AI service error',
                    status
                );
        }
    }
}

module.exports = AIService;
