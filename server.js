const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the public directory
app.use(express.static('public'));

// Basic route to serve the new IDE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tactical-ide.html'));
});

// Legacy route for the old IDE
app.get('/legacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dynamic-ide.html'));
});

// Grok API client configuration
const grokClient = axios.create({
    baseURL: 'https://api.x.ai/v1',
    headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json'
    },
    timeout: 60000 // 60 second timeout for AI requests
});

// Enhanced Grok completions endpoint
app.post('/api/completion', async (req, res) => {
    try {
        if (!process.env.XAI_API_KEY) {
            throw new Error('XAI_API_KEY environment variable not set');
        }

        const { messages, temperature = 0.7, max_tokens = 4000 } = req.body;

        console.log('[AI] Processing completion request...');

        const response = await grokClient.post('/chat/completions', {
            model: "grok-3-latest",
            messages: messages,
            temperature: temperature,
            max_tokens: max_tokens,
            stream: false
        });

        console.log('[AI] Completion successful');
        res.json(response.data);

    } catch (error) {
        console.error('[AI ERROR]', error.message);
        
        if (error.response) {
            console.error('[AI ERROR] Response:', error.response.data);
            res.status(error.response.status).json({
                error: 'AI service error',
                message: error.response.data.error?.message || error.message,
                details: error.response.data
            });
        } else if (error.request) {
            res.status(503).json({
                error: 'AI service unavailable',
                message: 'Unable to reach AI service'
            });
        } else {
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    }
});

// Image generation endpoint using xAI's actual image generation API
app.post('/api/generate-image', async (req, res) => {
    try {
        if (!process.env.XAI_API_KEY) {
            throw new Error('XAI_API_KEY environment variable not set');
        }

        const { prompt, n = 1, response_format = "url" } = req.body;

        console.log('[AI] Processing image generation request...');

        const response = await grokClient.post('/images/generations', {
            model: "grok-2-image",
            prompt: prompt,
            n: n,
            response_format: response_format
        });

        console.log('[AI] Image generation completed');
        
        // Format response to match expected structure
        const imageResponse = {
            imageUrl: response.data.data[0].url || response.data.data[0].b64_json,
            prompt: prompt,
            n: n,
            response_format: response_format,
            created: Math.floor(Date.now() / 1000),
            data: response.data.data
        };

        res.json(imageResponse);

    } catch (error) {
        console.error('[AI ERROR] Image generation failed:', error.message);
        
        if (error.response) {
            console.error('[AI ERROR] Response:', error.response.data);
            res.status(error.response.status).json({
                error: 'Image generation failed',
                message: error.response.data.error?.message || error.message,
                details: error.response.data
            });
        } else {
            res.status(500).json({
                error: 'Image generation failed',
                message: error.message
            });
        }
    }
});

// Code analysis endpoint
app.post('/api/analyze-code', async (req, res) => {
    try {
        if (!process.env.XAI_API_KEY) {
            throw new Error('XAI_API_KEY environment variable not set');
        }

        const { code, language, analysisType = 'general' } = req.body;

        const analysisPrompts = {
            general: 'Analyze this code for potential improvements, bugs, and best practices.',
            security: 'Perform a security analysis of this code, identifying potential vulnerabilities.',
            performance: 'Analyze this code for performance issues and optimization opportunities.',
            style: 'Review this code for style consistency and adherence to best practices.'
        };

        const systemPrompt = `You are a code analysis AI. ${analysisPrompts[analysisType]} 
        Provide specific, actionable feedback with code examples where appropriate.
        Format your response with clear sections and use markdown for code blocks.`;

        const response = await grokClient.post('/chat/completions', {
            model: "grok-3-latest",
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: `Language: ${language}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``
                }
            ],
            temperature: 0.3,
            max_tokens: 4000
        });

        res.json({
            analysis: response.data.choices[0].message.content,
            analysisType: analysisType,
            language: language
        });

    } catch (error) {
        console.error('[AI ERROR] Code analysis failed:', error.message);
        res.status(500).json({
            error: 'Code analysis failed',
            message: error.message
        });
    }
});

// Project structure analysis endpoint
app.post('/api/analyze-project', async (req, res) => {
    try {
        if (!process.env.XAI_API_KEY) {
            throw new Error('XAI_API_KEY environment variable not set');
        }

        const { fileStructure, projectType } = req.body;

        const systemPrompt = `You are a project analysis AI. Analyze the provided project structure 
        and provide insights about architecture, organization, potential issues, and recommendations for improvement.
        Consider the project type: ${projectType || 'general'}.`;

        const response = await grokClient.post('/chat/completions', {
            model: "grok-3-latest",
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: `Project Structure:\n${JSON.stringify(fileStructure, null, 2)}`
                }
            ],
            temperature: 0.4,
            max_tokens: 3000
        });

        res.json({
            analysis: response.data.choices[0].message.content,
            projectType: projectType
        });

    } catch (error) {
        console.error('[AI ERROR] Project analysis failed:', error.message);
        res.status(500).json({
            error: 'Project analysis failed',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'SYSTEM ONLINE',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: {
            aiCompletion: !!process.env.XAI_API_KEY,
            imageGeneration: !!process.env.XAI_API_KEY,
            codeAnalysis: !!process.env.XAI_API_KEY
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]', err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: 'A system error occurred'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        message: 'The requested endpoint does not exist'
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('[SERVER] Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[SERVER] Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

// Start the server
app.listen(port, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                      GROK IDE SERVER                         ║
    ║                         SYSTEM ONLINE                        ║
    ╠══════════════════════════════════════════════════════════════╣
    ║  Server running at: http://localhost:${port}                     ║
    ║  AI Features: ${process.env.XAI_API_KEY ? 'ENABLED' : 'DISABLED'}                              ║
    ║  Status: READY FOR OPERATIONS                                ║
    ╚══════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;