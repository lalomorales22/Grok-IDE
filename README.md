# Grok IDE
<img width="1326" alt="Screenshot 2024-11-12 at 6 25 40 PM" src="https://github.com/user-attachments/assets/e2b754de-8654-45f7-a9b9-b69a0507538c">

A modern, web-based IDE integrated with xAI's Grok AI assistant. This project provides a development environment that combines traditional coding capabilities with AI-powered assistance.

## Features

- 🖥️ **Modern Web Interface** - Clean and intuitive IDE layout
- 📁 **File Explorer** - Browse and manage your project files
- 💾 **File Operations** - Open folders and save files directly from the IDE
- 🤖 **Grok AI Integration** - Get real-time AI assistance while coding
- ↔️ **Resizable Panels** - Customizable layout with resizable editor and AI assistant panels

## Prerequisites

- Node.js (v14 or higher recommended)
- NPM (Node Package Manager)
- xAI API Key for Grok integration

## Installation

1. Clone the repository:
```bash
git clone https://github.com/lalomorales22/Grok-IDE.git
cd Grok-IDE
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your xAI API key:
```
XAI_API_KEY=your_api_key_here
PORT=3000
```

## Running the Application

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3000`

## Project Structure

- `public/` - Static files and frontend assets
- `server.js` - Express server setup and API endpoints
- `dynamic-ide.html` - Main IDE interface

## Environment Variables

- `XAI_API_KEY` - Your xAI API key for Grok integration
- `PORT` - Server port (defaults to 3000)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Express.js
- Powered by xAI's Grok API
- Inspired by modern IDE interfaces

---

⚠️ Note: This project requires a valid xAI API key to use the Grok AI features. Make sure to keep your API key secret and never commit it to version control.
