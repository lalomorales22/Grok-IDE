const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static('public'));

// Basic route to serve the IDE HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dynamic-ide.html'));
});

// Grok API integration
const grokClient = axios.create({
    baseURL: 'https://api.x.ai/v1',
    headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

// Example endpoint for Grok completions
app.post('/api/completion', async (req, res) => {
    try {
        if (!process.env.XAI_API_KEY) {
            throw new Error('XAI_API_KEY environment variable not set');
        }

        const response = await grokClient.post('/chat/completions', {
            model: "grok-beta",
            messages: req.body.messages,
            // Add other parameters as needed based on the API documentation
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error calling Grok API:', error.message);
        res.status(500).json({ 
            error: 'Failed to get completion',
            message: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
