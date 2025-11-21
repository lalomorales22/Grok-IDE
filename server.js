const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const { execSync, spawn } = require('child_process');
const fs = require('fs');

// Development server management
let activeServers = new Map(); // Track running development servers

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize SQLite database
const db = new sqlite3.Database('./grok_ide_chat_history.db', (err) => {
    if (err) {
        console.error('[DB ERROR] Error opening database:', err.message);
    } else {
        console.log('[DB] Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    const createSessionsTable = `
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    const createMessagesTable = `
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            user_message TEXT NOT NULL,
            ai_response TEXT NOT NULL,
            has_images BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES chat_sessions (id)
        )
    `;
    
    db.run(createSessionsTable, (err) => {
        if (err) {
            console.error('[DB ERROR] Error creating sessions table:', err.message);
        } else {
            console.log('[DB] Chat sessions table ready');
        }
    });
    
    db.run(createMessagesTable, (err) => {
        if (err) {
            console.error('[DB ERROR] Error creating messages table:', err.message);
        } else {
            console.log('[DB] Chat messages table ready');
        }
    });
}

// Middleware to parse JSON bodies with larger limit for images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the public directory
app.use(express.static('public'));

// Serve files from current working directory for terminal browser access
app.use('/serve', express.static('.'));

// Main route to serve the Grok IDE (v4 by default)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'GrokIDE-v4.html'));
});

// Alternative route for the Grok IDE
app.get('/ide', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'GrokIDE-v4.html'));
});

// Version-specific routes
app.get('/v4', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'GrokIDE-v4.html'));
});

app.get('/v3', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'GrokIDE-v3.html'));
});

app.get('/v2', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'GrokIDE-v2.html'));
});

app.get('/v1', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'GrokIDE.html'));
});

// Legacy route
app.get('/legacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'GrokIDE.html'));
});

// Grok API client configuration
const grokClient = axios.create({
    baseURL: 'https://api.x.ai/v1',
    headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json'
    },
    timeout: 120000 // 120 second timeout for AI requests (increased for stability)
});

// Add retry logic for better reliability
try {
    const axiosRetry = require('axios-retry');
    axiosRetry(grokClient, { 
        retries: 3, 
        retryDelay: (retryCount) => retryCount * 1000,
        retryCondition: (error) => {
            return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
                   (error.response?.status >= 500);
        }
    });
    console.log('[INIT] Axios retry configured');
} catch (err) {
    console.warn('[INIT] axios-retry not available, continuing without retry logic');
}

// Enhanced Grok completions endpoint with image support and streaming
app.post('/api/completion', async (req, res) => {
    try {
        if (!process.env.XAI_API_KEY) {
            throw new Error('XAI_API_KEY environment variable not set');
        }

        let { messages, temperature = 0.7, max_tokens = 8000, stream = true } = req.body;

        console.log('[AI] Processing completion request...');
        
        // Log payload size for debugging and auto-adjust tokens
        const payloadSize = JSON.stringify(messages).length;
        console.log(`[AI] Payload size: ${payloadSize} characters`);
        
        // Dynamic token adjustment based on payload size
        if (payloadSize > 100000) {
            max_tokens = Math.min(max_tokens * 2, 16000); // Double tokens for very large payloads, cap at 16k
            console.warn('[AI] Very large payload detected - increased max_tokens to', max_tokens);
        } else if (payloadSize > 50000) {
            max_tokens = Math.min(max_tokens * 1.5, 12000); // 1.5x tokens for large payloads, cap at 12k
            console.log('[AI] Large payload detected - increased max_tokens to', max_tokens);
        }
        
        console.log(`[AI] Request details: ${messages.length} messages, temp=${temperature}, max_tokens=${max_tokens}, stream=${stream}`);
        
        console.time('ai-completion-request');

        // Check if any message contains images
        const hasImages = messages.some(msg => 
            Array.isArray(msg.content) && 
            msg.content.some(item => item.type === 'image_url')
        );

        // Set headers for streaming
        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
        }

        const requestConfig = {
            model: hasImages ? "grok-vision-beta" : "grok-4-0709",
            messages: messages,
            temperature: temperature,
            max_tokens: max_tokens,
            stream: stream
        };

        if (stream) {
            try {
                // Attempt streaming response
                console.log('[AI] Attempting streaming response...');
                const response = await grokClient.post('/chat/completions', requestConfig, {
                    responseType: 'stream'
                });

                let buffer = '';
                let streamEnded = false;
                
                // Set up timeout for streaming
                const streamTimeout = setTimeout(() => {
                    if (!streamEnded && !res.headersSent) {
                        console.log('[AI] Stream timeout, falling back to non-streaming');
                        streamEnded = true;
                        // Fallback to non-streaming
                        handleNonStreamingFallback();
                    }
                }, 30000); // 30 second timeout
                
                response.data.on('data', (chunk) => {
                    if (streamEnded) return;
                    
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer
                    
                    for (const line of lines) {
                        if (line.trim() === '') continue;
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data.trim() === '[DONE]') {
                                clearTimeout(streamTimeout);
                                streamEnded = true;
                                res.write('data: [DONE]\n\n');
                                res.end();
                                console.timeEnd('ai-completion-request');
                                return;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                res.write(`data: ${JSON.stringify(parsed)}\n\n`);
                            } catch (e) {
                                console.error('[AI ERROR] Failed to parse streaming chunk:', e);
                                // Continue processing other chunks
                            }
                        }
                    }
                });

                response.data.on('end', () => {
                    clearTimeout(streamTimeout);
                    if (!streamEnded && !res.headersSent) {
                        streamEnded = true;
                        res.write('data: [DONE]\n\n');
                        res.end();
                    }
                });

                response.data.on('error', (error) => {
                    clearTimeout(streamTimeout);
                    console.error('[AI ERROR] Streaming error:', error);
                    if (!streamEnded && !res.headersSent) {
                        streamEnded = true;
                        console.log('[AI] Streaming failed, attempting fallback...');
                        handleNonStreamingFallback();
                    }
                });

                async function handleNonStreamingFallback() {
                    try {
                        console.log('[AI] Falling back to non-streaming...');
                        const fallbackConfig = { ...requestConfig, stream: false };
                        const fallbackResponse = await grokClient.post('/chat/completions', fallbackConfig);
                        
                        // Reset headers for non-streaming response
                        res.setHeader('Content-Type', 'application/json');
                        console.timeEnd('ai-completion-request');
                        res.json(fallbackResponse.data);
                    } catch (fallbackError) {
                        console.error('[AI ERROR] Fallback also failed:', fallbackError);
                        if (!res.headersSent) {
                            res.status(500).json({
                                error: 'AI service error',
                                message: fallbackError.message
                            });
                        }
                    }
                }

            } catch (streamingError) {
                console.error('[AI ERROR] Streaming setup failed:', streamingError);
                // Immediate fallback to non-streaming
                const fallbackConfig = { ...requestConfig, stream: false };
                const response = await grokClient.post('/chat/completions', fallbackConfig);
                console.log('[AI] Non-streaming fallback successful');
                
                // Reset headers for non-streaming response
                res.setHeader('Content-Type', 'application/json');
                console.timeEnd('ai-completion-request');
                res.json(response.data);
            }
        } else {
            // Handle non-streaming response
            const response = await grokClient.post('/chat/completions', requestConfig);
            console.log('[AI] Completion successful');
            console.timeEnd('ai-completion-request');
            res.json(response.data);
        }

    } catch (error) {
        console.timeEnd('ai-completion-request');
        console.error('[AI ERROR]', error.message);
        console.error('[AI ERROR] Stack:', error.stack);
        
        if (error.response) {
            console.error('[AI ERROR] Response status:', error.response.status);
            console.error('[AI ERROR] Response headers:', error.response.headers);
            console.error('[AI ERROR] Response data:', error.response.data);
            
            // Provide more specific error messages
            let errorMessage = error.response.data.error?.message || error.message;
            if (error.response.status === 401) {
                errorMessage = 'Invalid API key. Please check your XAI_API_KEY environment variable.';
            } else if (error.response.status === 413) {
                errorMessage = 'Request too large. Try reducing image size or prompt length.';
            } else if (error.response.status === 429) {
                errorMessage = 'Rate limit exceeded. Please try again later.';
            }
            
            res.status(error.response.status).json({
                error: 'AI service error',
                message: errorMessage,
                details: error.response.data,
                hasApiKey: !!process.env.XAI_API_KEY
            });
        } else if (error.request) {
            console.error('[AI ERROR] No response received:', error.request);
            res.status(503).json({
                error: 'AI service unavailable',
                message: 'Unable to reach AI service. Check your internet connection.',
                hasApiKey: !!process.env.XAI_API_KEY
            });
        } else {
            console.error('[AI ERROR] Setup error:', error.message);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message,
                hasApiKey: !!process.env.XAI_API_KEY
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

// Code analysis endpoint with RAG capabilities
app.post('/api/analyze-code', async (req, res) => {
    try {
        if (!process.env.XAI_API_KEY) {
            throw new Error('XAI_API_KEY environment variable not set');
        }

        const { code, language, analysisType = 'general', context = '' } = req.body;

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

        console.log('[AI] Starting code analysis...');
        console.time('code-analysis-request');
        
        const response = await grokClient.post('/chat/completions', {
            model: "grok-4-0709",
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userContent
                }
            ],
            temperature: 0.3,
            max_tokens: 8000
        });
        
        console.timeEnd('code-analysis-request');

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

// Project structure analysis endpoint with enhanced RAG
app.post('/api/analyze-project', async (req, res) => {
    try {
        if (!process.env.XAI_API_KEY) {
            throw new Error('XAI_API_KEY environment variable not set');
        }

        const { fileStructure, projectType, fileContents = {} } = req.body;

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

        console.log('[AI] Starting project analysis...');
        console.time('project-analysis-request');
        
        const response = await grokClient.post('/chat/completions', {
            model: "grok-4-0709",
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: analysisContent
                }
            ],
            temperature: 0.4,
            max_tokens: 8000
        });
        
        console.timeEnd('project-analysis-request');

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

// Image analysis endpoint for uploaded images
app.post('/api/analyze-image', async (req, res) => {
    try {
        if (!process.env.XAI_API_KEY) {
            throw new Error('XAI_API_KEY environment variable not set');
        }

        const { imageData, prompt = "Analyze this image and describe what you see." } = req.body;

        console.log('[AI] Processing image analysis request...');

        const response = await grokClient.post('/chat/completions', {
            model: "grok-vision-beta",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageData
                            }
                        }
                    ]
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        console.log('[AI] Image analysis completed');
        
        res.json({
            analysis: response.data.choices[0].message.content,
            prompt: prompt
        });

    } catch (error) {
        console.error('[AI ERROR] Image analysis failed:', error.message);
        
        if (error.response) {
            console.error('[AI ERROR] Response:', error.response.data);
            res.status(error.response.status).json({
                error: 'Image analysis failed',
                message: error.response.data.error?.message || error.message,
                details: error.response.data
            });
        } else {
            res.status(500).json({
                error: 'Image analysis failed',
                message: error.message
            });
        }
    }
});

// Smart Code Insertion endpoint
app.post('/api/smart-insert', async (req, res) => {
    try {
        if (!process.env.XAI_API_KEY) {
            throw new Error('XAI_API_KEY environment variable not set');
        }

        const { currentContent, codeToInsert, fileName, language } = req.body;

        if (!currentContent || !codeToInsert || !fileName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters'
            });
        }

        console.log('[AI] Processing smart insertion request...');

        const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
        const detectedLanguage = language || getLanguageFromExtension(fileExtension);

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

        console.log('[AI] Starting smart insertion analysis...');
        console.time('smart-insertion-request');
        
        const response = await grokClient.post('/chat/completions', {
            model: "grok-4-0709",
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ],
            temperature: 0.1, // Low temperature for consistent, logical responses
            max_tokens: 8000
        });
        
        console.timeEnd('smart-insertion-request');

        console.log('[AI] Smart insertion analysis completed');

        // Parse the AI response
        let aiResponse = response.data.choices[0].message.content.trim();
        
        // Clean up the response if it's wrapped in markdown
        if (aiResponse.startsWith('```json')) {
            aiResponse = aiResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (aiResponse.startsWith('```')) {
            aiResponse = aiResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        try {
            const result = JSON.parse(aiResponse);
            
            // Validate the response structure
            if (result.success && result.newContent) {
                // Calculate insertion positions if not provided
                if (!result.insertionStart || !result.insertionEnd) {
                    const insertionPos = findInsertionPosition(currentContent, result.newContent, codeToInsert);
                    result.insertionStart = insertionPos.start;
                    result.insertionEnd = insertionPos.end;
                }
                
                res.json(result);
            } else {
                throw new Error('Invalid AI response structure');
            }
        } catch (parseError) {
            console.error('[AI ERROR] Failed to parse AI response:', parseError);
            console.error('[AI ERROR] Raw response:', aiResponse);
            
            // Fallback: provide a basic insertion strategy
            res.json({
                success: false,
                error: 'AI response parsing failed',
                fallbackReason: 'Could not parse AI suggestion'
            });
        }

    } catch (error) {
        console.error('[AI ERROR] Smart insertion failed:', error.message);
        
        if (error.response) {
            console.error('[AI ERROR] Response data:', error.response.data);
            res.status(error.response.status).json({
                success: false,
                error: 'AI service error',
                message: error.response.data.error?.message || error.message
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Smart insertion failed',
                message: error.message
            });
        }
    }
});

// Helper function to determine language from file extension
function getLanguageFromExtension(extension) {
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

// Helper function to find insertion position in case AI doesn't provide it
function findInsertionPosition(originalContent, newContent, insertedCode) {
    try {
        // Find the first difference between original and new content
        let start = 0;
        while (start < originalContent.length && start < newContent.length && 
               originalContent[start] === newContent[start]) {
            start++;
        }
        
        // Find the end of the insertion by working backwards
        let originalEnd = originalContent.length - 1;
        let newEnd = newContent.length - 1;
        
        while (originalEnd >= start && newEnd >= start && 
               originalContent[originalEnd] === newContent[newEnd]) {
            originalEnd--;
            newEnd--;
        }
        
        return {
            start: start,
            end: newEnd + 1
        };
    } catch (error) {
        console.error('Error calculating insertion position:', error);
        return { start: 0, end: 0 };
    }
}

// Terminal Command Execution endpoint
app.post('/api/terminal', (req, res) => {
    const { command, cwd = '.' } = req.body;
    
    if (!command) {
        return res.status(400).json({
            success: false,
            error: 'Command is required'
        });
    }

    console.log(`[TERMINAL] Executing: ${command} in ${cwd}`);

    try {
        const args = command.split(' ');
        const cmd = args[0];
        const params = args.slice(1);

        // Handle built-in terminal commands
        switch (cmd) {
            case 'help':
                res.json({
                    success: true,
                    output: `Available commands:
ls            - List directory contents
cd <dir>      - Change directory
pwd           - Show current directory
mkdir <dir>   - Create directory
touch <file>  - Create empty file
cat <file>    - Display file contents
echo <text>   - Echo text
open <file>   - Open file in IDE or run/serve based on type
serve <file>  - Start dev server for web files (HTML/PHP)
run <file>    - Execute script files (Python/JS/etc)
php <file>    - Run PHP file with built-in server
python <file> - Execute Python script
node <file>   - Execute Node.js script
devserver     - Start development server on port 8080
stopserver    - Stop development server
clear         - Clear terminal
help          - Show this help

File type behaviors:
- .html/.htm  - Opens in browser via dev server
- .php        - Runs with PHP built-in server
- .py         - Executes with Python interpreter
- .js         - Executes with Node.js (use 'node file.js')
- Others      - Opens in IDE editor

Standard Unix commands are also supported.`,
                    cwd: cwd
                });
                break;

            case 'clear':
                res.json({
                    success: true,
                    action: 'clear',
                    cwd: cwd
                });
                break;

            case 'pwd':
                const absolutePath = path.resolve(cwd);
                res.json({
                    success: true,
                    output: absolutePath,
                    cwd: cwd
                });
                break;

            case 'cd':
                const targetDir = params.length > 0 ? params[0] : '.';
                let newCwd;
                
                if (targetDir === '..') {
                    newCwd = path.dirname(cwd);
                } else if (targetDir === '.' || targetDir === '') {
                    newCwd = '.';
                } else if (path.isAbsolute(targetDir)) {
                    newCwd = targetDir;
                } else {
                    newCwd = path.join(cwd, targetDir);
                }
                
                // Verify directory exists
                try {
                    const fullPath = path.resolve(newCwd);
                    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
                        res.json({
                            success: true,
                            output: `Changed directory to: ${newCwd}`,
                            cwd: newCwd
                        });
                    } else {
                        res.json({
                            success: false,
                            error: `Directory not found: ${targetDir}`
                        });
                    }
                } catch (error) {
                    res.json({
                        success: false,
                        error: `Cannot access directory: ${error.message}`
                    });
                }
                break;

            case 'mkdir':
                if (params.length === 0) {
                    res.json({
                        success: false,
                        error: 'Usage: mkdir <directory_name>'
                    });
                    break;
                }
                
                try {
                    const dirPath = path.join(cwd, params[0]);
                    const fullPath = path.resolve(dirPath);
                    fs.mkdirSync(fullPath, { recursive: true });
                    res.json({
                        success: true,
                        output: `Directory created: ${params[0]}`,
                        cwd: cwd
                    });
                } catch (error) {
                    res.json({
                        success: false,
                        error: `Failed to create directory: ${error.message}`
                    });
                }
                break;

            case 'touch':
                if (params.length === 0) {
                    res.json({
                        success: false,
                        error: 'Usage: touch <filename>'
                    });
                    break;
                }
                
                try {
                    const filePath = path.join(cwd, params[0]);
                    const fullPath = path.resolve(filePath);
                    fs.writeFileSync(fullPath, '');
                    res.json({
                        success: true,
                        output: `File created: ${params[0]}`,
                        cwd: cwd
                    });
                } catch (error) {
                    res.json({
                        success: false,
                        error: `Failed to create file: ${error.message}`
                    });
                }
                break;

            case 'cat':
                if (params.length === 0) {
                    res.json({
                        success: false,
                        error: 'Usage: cat <filename>'
                    });
                    break;
                }
                
                try {
                    const filePath = path.join(cwd, params[0]);
                    const fullPath = path.resolve(filePath);
                    const content = fs.readFileSync(fullPath, 'utf8');
                    res.json({
                        success: true,
                        output: content,
                        cwd: cwd
                    });
                } catch (error) {
                    res.json({
                        success: false,
                        error: `Failed to read file: ${error.message}`
                    });
                }
                break;

            case 'echo':
                const text = params.join(' ');
                res.json({
                    success: true,
                    output: text,
                    cwd: cwd
                });
                break;

            case 'open':
                if (params.length === 0) {
                    res.json({
                        success: false,
                        error: 'Usage: open <filename>'
                    });
                    break;
                }
                
                try {
                    const filePath = path.join(cwd, params[0]);
                    const fullPath = path.resolve(filePath);
                    
                    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                        const fileExtension = path.extname(params[0]).toLowerCase();
                        
                        switch (fileExtension) {
                            case '.html':
                            case '.htm':
                                // Start dev server and open in browser
                                res.json({
                                    success: true,
                                    output: `Starting dev server and opening ${params[0]}...`,
                                    action: 'startDevServer',
                                    filePath: params[0],
                                    fullPath: fullPath,
                                    cwd: cwd
                                });
                                break;
                            case '.php':
                                // Start PHP server
                                res.json({
                                    success: true,
                                    output: `Starting PHP server for ${params[0]}...`,
                                    action: 'startPHPServer',
                                    filePath: params[0],
                                    fullPath: fullPath,
                                    cwd: cwd
                                });
                                break;
                            case '.py':
                                // Execute Python script
                                res.json({
                                    success: true,
                                    output: `Executing Python script ${params[0]}...`,
                                    action: 'runPython',
                                    filePath: params[0],
                                    fullPath: fullPath,
                                    cwd: cwd
                                });
                                break;
                            case '.js':
                                // Open in IDE (for Node.js use 'node filename.js')
                                res.json({
                                    success: true,
                                    output: `Opening ${params[0]} in IDE (use 'node ${params[0]}' to execute)`,
                                    action: 'openFile',
                                    filePath: params[0],
                                    cwd: cwd
                                });
                                break;
                            default:
                                // Open in IDE
                                res.json({
                                    success: true,
                                    output: `Opening file: ${params[0]}`,
                                    action: 'openFile',
                                    filePath: params[0],
                                    cwd: cwd
                                });
                                break;
                        }
                    } else {
                        res.json({
                            success: false,
                            error: `File not found: ${params[0]}`
                        });
                    }
                } catch (error) {
                    res.json({
                        success: false,
                        error: `Cannot access file: ${error.message}`
                    });
                }
                break;

            case 'serve':
                if (params.length === 0) {
                    res.json({
                        success: true,
                        output: 'Starting development server on port 8080...',
                        action: 'startDevServer',
                        cwd: cwd
                    });
                    break;
                }
                
                try {
                    const filePath = path.join(cwd, params[0]);
                    const fullPath = path.resolve(filePath);
                    
                    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                        const fileExtension = path.extname(params[0]).toLowerCase();
                        if (fileExtension === '.html' || fileExtension === '.htm') {
                            res.json({
                                success: true,
                                output: `Starting dev server and opening ${params[0]}...`,
                                action: 'startDevServer',
                                filePath: params[0],
                                fullPath: fullPath,
                                cwd: cwd
                            });
                        } else if (fileExtension === '.php') {
                            res.json({
                                success: true,
                                output: `Starting PHP server for ${params[0]}...`,
                                action: 'startPHPServer',
                                filePath: params[0],
                                fullPath: fullPath,
                                cwd: cwd
                            });
                        } else {
                            res.json({
                                success: false,
                                error: `Cannot serve ${params[0]}. Supported: HTML, PHP files.`
                            });
                        }
                    } else {
                        res.json({
                            success: false,
                            error: `File not found: ${params[0]}`
                        });
                    }
                } catch (error) {
                    res.json({
                        success: false,
                        error: `Cannot access file: ${error.message}`
                    });
                }
                break;

            case 'run':
                if (params.length === 0) {
                    res.json({
                        success: false,
                        error: 'Usage: run <script-file>'
                    });
                    break;
                }
                
                try {
                    const filePath = path.join(cwd, params[0]);
                    const fullPath = path.resolve(filePath);
                    
                    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                        const fileExtension = path.extname(params[0]).toLowerCase();
                        
                        switch (fileExtension) {
                            case '.py':
                                res.json({
                                    success: true,
                                    output: `Executing Python script ${params[0]}...`,
                                    action: 'runPython',
                                    filePath: params[0],
                                    fullPath: fullPath,
                                    cwd: cwd
                                });
                                break;
                            case '.js':
                                res.json({
                                    success: true,
                                    output: `Executing Node.js script ${params[0]}...`,
                                    action: 'runNode',
                                    filePath: params[0],
                                    fullPath: fullPath,
                                    cwd: cwd
                                });
                                break;
                            case '.php':
                                res.json({
                                    success: true,
                                    output: `Starting PHP server for ${params[0]}...`,
                                    action: 'startPHPServer',
                                    filePath: params[0],
                                    fullPath: fullPath,
                                    cwd: cwd
                                });
                                break;
                            default:
                                res.json({
                                    success: false,
                                    error: `Cannot run ${params[0]}. Supported: .py, .js, .php files.`
                                });
                                break;
                        }
                    } else {
                        res.json({
                            success: false,
                            error: `File not found: ${params[0]}`
                        });
                    }
                } catch (error) {
                    res.json({
                        success: false,
                        error: `Cannot access file: ${error.message}`
                    });
                }
                break;

            case 'python':
                if (params.length === 0) {
                    res.json({
                        success: false,
                        error: 'Usage: python <script.py>'
                    });
                    break;
                }
                
                try {
                    const filePath = path.join(cwd, params[0]);
                    const fullPath = path.resolve(filePath);
                    
                    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                        res.json({
                            success: true,
                            output: `Executing Python script ${params[0]}...`,
                            action: 'runPython',
                            filePath: params[0],
                            fullPath: fullPath,
                            cwd: cwd
                        });
                    } else {
                        res.json({
                            success: false,
                            error: `File not found: ${params[0]}`
                        });
                    }
                } catch (error) {
                    res.json({
                        success: false,
                        error: `Cannot access file: ${error.message}`
                    });
                }
                break;

            case 'node':
                if (params.length === 0) {
                    res.json({
                        success: false,
                        error: 'Usage: node <script.js>'
                    });
                    break;
                }
                
                try {
                    const filePath = path.join(cwd, params[0]);
                    const fullPath = path.resolve(filePath);
                    
                    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                        res.json({
                            success: true,
                            output: `Executing Node.js script ${params[0]}...`,
                            action: 'runNode',
                            filePath: params[0],
                            fullPath: fullPath,
                            cwd: cwd
                        });
                    } else {
                        res.json({
                            success: false,
                            error: `File not found: ${params[0]}`
                        });
                    }
                } catch (error) {
                    res.json({
                        success: false,
                        error: `Cannot access file: ${error.message}`
                    });
                }
                break;

            case 'php':
                if (params.length === 0) {
                    res.json({
                        success: false,
                        error: 'Usage: php <script.php>'
                    });
                    break;
                }
                
                try {
                    const filePath = path.join(cwd, params[0]);
                    const fullPath = path.resolve(filePath);
                    
                    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                        res.json({
                            success: true,
                            output: `Starting PHP server for ${params[0]}...`,
                            action: 'startPHPServer',
                            filePath: params[0],
                            fullPath: fullPath,
                            cwd: cwd
                        });
                    } else {
                        res.json({
                            success: false,
                            error: `File not found: ${params[0]}`
                        });
                    }
                } catch (error) {
                    res.json({
                        success: false,
                        error: `Cannot access file: ${error.message}`
                    });
                }
                break;

            case 'devserver':
                res.json({
                    success: true,
                    output: 'Starting development server on port 8080...',
                    action: 'startDevServer',
                    cwd: cwd
                });
                break;

            case 'stopserver':
                res.json({
                    success: true,
                    output: 'Stopping development servers...',
                    action: 'stopServers',
                    cwd: cwd
                });
                break;

            case 'ls':
            default:
                // Execute system commands
                try {
                    const options = {
                        cwd: path.resolve(cwd),
                        encoding: 'utf8',
                        timeout: 10000, // 10 second timeout
                        maxBuffer: 1024 * 1024 // 1MB buffer
                    };
                    
                    const output = execSync(command, options);
                    res.json({
                        success: true,
                        output: output.toString().trim(),
                        cwd: cwd
                    });
                } catch (error) {
                    res.json({
                        success: false,
                        error: error.message || 'Command execution failed'
                    });
                }
                break;
        }
    } catch (error) {
        console.error('[TERMINAL ERROR]', error);
        res.json({
            success: false,
            error: 'Terminal command failed: ' + error.message
        });
    }
});

// Development server management functions
function startDevServer(workingDir, filePath = null) {
    const port = 8080;
    const key = `devserver:${port}`;
    
    // Stop existing server if any
    if (activeServers.has(key)) {
        activeServers.get(key).kill();
        activeServers.delete(key);
    }
    
    try {
        // Start a simple HTTP server using Node.js
        const http = require('http');
        const url = require('url');
        
        const server = http.createServer((req, res) => {
            const pathname = url.parse(req.url).pathname;
            let filePath = path.join(workingDir, pathname === '/' ? 'index.html' : pathname);
            
            // Security check
            if (!filePath.startsWith(path.resolve(workingDir))) {
                res.writeHead(403);
                res.end('Forbidden');
                return;
            }
            
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end('File not found');
                    return;
                }
                
                const ext = path.extname(filePath);
                let contentType = 'text/html';
                if (ext === '.js') contentType = 'application/javascript';
                else if (ext === '.css') contentType = 'text/css';
                else if (ext === '.json') contentType = 'application/json';
                else if (ext === '.png') contentType = 'image/png';
                else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
                
                res.writeHead(200, {'Content-Type': contentType});
                res.end(data);
            });
        });
        
        server.listen(port, () => {
            console.log(`Dev server started on port ${port}`);
            activeServers.set(key, server);
        });
        
        const openUrl = filePath ? 
            `http://localhost:${port}/${path.basename(filePath)}` : 
            `http://localhost:${port}`;
        
        return { success: true, port, url: openUrl };
    } catch (error) {
        console.error('Failed to start dev server:', error);
        return { success: false, error: error.message };
    }
}

function startPHPServer(workingDir, filePath) {
    const port = 8081;
    const key = `php:${port}`;
    
    // Stop existing server if any
    if (activeServers.has(key)) {
        activeServers.get(key).kill();
        activeServers.delete(key);
    }
    
    try {
        const phpServer = spawn('php', ['-S', `localhost:${port}`, '-t', workingDir], {
            cwd: workingDir,
            stdio: 'pipe'
        });
        
        activeServers.set(key, phpServer);
        
        phpServer.stdout.on('data', (data) => {
            console.log(`PHP Server: ${data}`);
        });
        
        phpServer.stderr.on('data', (data) => {
            console.error(`PHP Server Error: ${data}`);
        });
        
        phpServer.on('close', (code) => {
            console.log(`PHP server exited with code ${code}`);
            activeServers.delete(key);
        });
        
        const openUrl = filePath ? 
            `http://localhost:${port}/${path.basename(filePath)}` : 
            `http://localhost:${port}`;
        
        return { success: true, port, url: openUrl };
    } catch (error) {
        console.error('Failed to start PHP server:', error);
        return { success: false, error: error.message };
    }
}

function executePython(filePath, workingDir) {
    return new Promise((resolve) => {
        // Try python3 first, then python
        const pythonCommands = ['python3', 'python'];
        let currentCommandIndex = 0;
        
        function tryCommand(command) {
            try {
                const pythonProcess = spawn(command, [filePath], {
                    cwd: workingDir,
                    stdio: 'pipe'
                });
                
                let output = '';
                let errorOutput = '';
                
                pythonProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });
                
                pythonProcess.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });
                
                pythonProcess.on('close', (code) => {
                    resolve({
                        success: code === 0,
                        output: output || errorOutput,
                        exitCode: code
                    });
                });
                
                pythonProcess.on('error', (error) => {
                    // If this command fails and we have more to try
                    if (currentCommandIndex < pythonCommands.length - 1) {
                        currentCommandIndex++;
                        tryCommand(pythonCommands[currentCommandIndex]);
                    } else {
                        resolve({
                            success: false,
                            output: `Python not found. Please install Python and ensure it's in your PATH.\nError: ${error.message}`,
                            exitCode: -1
                        });
                    }
                });
                
                // Set timeout
                setTimeout(() => {
                    pythonProcess.kill();
                    resolve({
                        success: false,
                        output: 'Script execution timed out (30 seconds)',
                        exitCode: -1
                    });
                }, 30000);
                
            } catch (error) {
                if (currentCommandIndex < pythonCommands.length - 1) {
                    currentCommandIndex++;
                    tryCommand(pythonCommands[currentCommandIndex]);
                } else {
                    resolve({
                        success: false,
                        output: `Error executing Python script: ${error.message}`,
                        exitCode: -1
                    });
                }
            }
        }
        
        tryCommand(pythonCommands[currentCommandIndex]);
    });
}

function executeNode(filePath, workingDir) {
    return new Promise((resolve) => {
        try {
            const nodeProcess = spawn('node', [filePath], {
                cwd: workingDir,
                stdio: 'pipe'
            });
            
            let output = '';
            let errorOutput = '';
            
            nodeProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            nodeProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            nodeProcess.on('close', (code) => {
                resolve({
                    success: code === 0,
                    output: output || errorOutput,
                    exitCode: code
                });
            });
            
            setTimeout(() => {
                nodeProcess.kill();
                resolve({
                    success: false,
                    output: 'Script execution timed out (30 seconds)',
                    exitCode: -1
                });
            }, 30000);
            
        } catch (error) {
            resolve({
                success: false,
                output: `Error executing Node.js script: ${error.message}`,
                exitCode: -1
            });
        }
    });
}

function stopAllServers() {
    for (const [key, server] of activeServers) {
        try {
            if (server.kill) {
                server.kill();
            } else if (server.close) {
                server.close();
            }
        } catch (error) {
            console.error(`Error stopping server ${key}:`, error);
        }
    }
    activeServers.clear();
    return { success: true, message: 'All servers stopped' };
}

// Server action endpoints
app.post('/api/start-dev-server', (req, res) => {
    const { workingDir, filePath } = req.body;
    const result = startDevServer(workingDir, filePath);
    res.json(result);
});

app.post('/api/start-php-server', (req, res) => {
    const { workingDir, filePath } = req.body;
    const result = startPHPServer(workingDir, filePath);
    res.json(result);
});

app.post('/api/execute-python', async (req, res) => {
    const { filePath, workingDir } = req.body;
    const result = await executePython(filePath, workingDir);
    res.json(result);
});

app.post('/api/execute-node', async (req, res) => {
    const { filePath, workingDir } = req.body;
    const result = await executeNode(filePath, workingDir);
    res.json(result);
});

app.post('/api/stop-servers', (req, res) => {
    const result = stopAllServers();
    res.json(result);
});

// Chat History endpoints
app.get('/api/chat-history', (req, res) => {
    const query = `
        SELECT 
            cs.id,
            cs.created_at,
            cs.updated_at,
            COUNT(cm.id) as message_count,
            (SELECT cm2.user_message 
             FROM chat_messages cm2 
             WHERE cm2.session_id = cs.id 
             ORDER BY cm2.created_at ASC 
             LIMIT 1) as first_message
        FROM chat_sessions cs
        LEFT JOIN chat_messages cm ON cs.id = cm.session_id
        GROUP BY cs.id
        ORDER BY cs.updated_at DESC
        LIMIT 50
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('[DB ERROR] Error fetching chat history:', err.message);
            res.status(500).json({ error: 'Failed to fetch chat history' });
        } else {
            res.json({ sessions: rows });
        }
    });
});

app.get('/api/chat-history/:sessionId', (req, res) => {
    const sessionId = parseInt(req.params.sessionId);
    
    const sessionQuery = 'SELECT * FROM chat_sessions WHERE id = ?';
    const messagesQuery = 'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC';
    
    db.get(sessionQuery, [sessionId], (err, session) => {
        if (err) {
            console.error('[DB ERROR] Error fetching session:', err.message);
            res.status(500).json({ error: 'Failed to fetch session' });
            return;
        }
        
        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }
        
        db.all(messagesQuery, [sessionId], (err, messages) => {
            if (err) {
                console.error('[DB ERROR] Error fetching messages:', err.message);
                res.status(500).json({ error: 'Failed to fetch messages' });
            } else {
                res.json({
                    ...session,
                    messages: messages
                });
            }
        });
    });
});

app.post('/api/chat-history', (req, res) => {
    const { sessionId, userMessage, aiResponse, hasImages } = req.body;
    
    if (!userMessage || !aiResponse) {
        res.status(400).json({ error: 'User message and AI response are required' });
        return;
    }
    
    function insertMessage(finalSessionId) {
        const insertMessageQuery = `
            INSERT INTO chat_messages (session_id, user_message, ai_response, has_images)
            VALUES (?, ?, ?, ?)
        `;
        
        db.run(insertMessageQuery, [finalSessionId, userMessage, aiResponse, hasImages ? 1 : 0], function(err) {
            if (err) {
                console.error('[DB ERROR] Error inserting message:', err.message);
                res.status(500).json({ error: 'Failed to save message' });
            } else {
                // Update session timestamp
                const updateSessionQuery = 'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?';
                db.run(updateSessionQuery, [finalSessionId], (err) => {
                    if (err) {
                        console.error('[DB ERROR] Error updating session:', err.message);
                    }
                });
                
                res.json({ 
                    messageId: this.lastID,
                    sessionId: finalSessionId,
                    success: true 
                });
            }
        });
    }
    
    if (sessionId) {
        // Use existing session
        insertMessage(sessionId);
    } else {
        // Create new session
        const createSessionQuery = 'INSERT INTO chat_sessions DEFAULT VALUES';
        
        db.run(createSessionQuery, function(err) {
            if (err) {
                console.error('[DB ERROR] Error creating session:', err.message);
                res.status(500).json({ error: 'Failed to create session' });
            } else {
                insertMessage(this.lastID);
            }
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'SYSTEM ONLINE',
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        features: {
            aiCompletion: !!process.env.XAI_API_KEY,
            imageGeneration: !!process.env.XAI_API_KEY,
            imageAnalysis: !!process.env.XAI_API_KEY,
            codeAnalysis: !!process.env.XAI_API_KEY,
            projectAnalysis: !!process.env.XAI_API_KEY
        }
    });
});

// Debug endpoint for API key status
app.get('/api/debug', (req, res) => {
    res.json({
        hasApiKey: !!process.env.XAI_API_KEY,
        apiKeyPrefix: process.env.XAI_API_KEY ? process.env.XAI_API_KEY.substring(0, 10) + '...' : 'Not set',
        timestamp: new Date().toISOString()
    });
});

// API Test endpoint for direct testing
app.post('/api/test', async (req, res) => {
    try {
        if (!process.env.XAI_API_KEY) {
            throw new Error('XAI_API_KEY environment variable not set');
        }

        console.log('[API TEST] Starting simple API test...');
        console.time('api-test-request');

        const testMessage = req.body.message || "Hello, this is a test message.";
        
        const response = await grokClient.post('/chat/completions', {
            model: "grok-4-0709",
            messages: [
                {
                    role: "user",
                    content: testMessage
                }
            ],
            temperature: 0.7,
            max_tokens: 100,
            stream: false
        });

        console.timeEnd('api-test-request');
        console.log('[API TEST] Test successful');

        res.json({
            success: true,
            model: "grok-4-0709",
            testMessage: testMessage,
            response: response.data.choices[0].message.content,
            usage: response.data.usage,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.timeEnd('api-test-request');
        console.error('[API TEST ERROR]', error.message);
        
        res.status(500).json({
            success: false,
            error: error.message,
            hasApiKey: !!process.env.XAI_API_KEY,
            timestamp: new Date().toISOString()
        });
    }
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
    db.close((err) => {
        if (err) {
            console.error('[DB ERROR] Error closing database:', err.message);
        } else {
            console.log('[DB] Database connection closed');
        }
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('[SERVER] Received SIGINT, shutting down gracefully...');
    
    // Stop all active servers
    stopAllServers();
    
    db.close((err) => {
        if (err) {
            console.error('[DB ERROR] Error closing database:', err.message);
        } else {
            console.log('[DB] Database connection closed');
        }
        process.exit(0);
    });
});

// Start the server
app.listen(port, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                      GROK IDE SERVER                         ║
    ║                         SYSTEM ONLINE                        ║
    ╠══════════════════════════════════════════════════════════════╣
    ║  Server running at: http://localhost:${port}                    ║
    ║  AI Features: ${process.env.XAI_API_KEY ? 'ENABLED' : 'DISABLED'}                                        ║
    ║  Image Analysis: ${process.env.XAI_API_KEY ? 'ENABLED' : 'DISABLED'}                                     ║
    ║  Status: READY FOR OPERATIONS                                ║
    ╚══════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;