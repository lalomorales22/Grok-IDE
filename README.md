# TACTICAL GROK IDE

<div align="center">

```
╔══════════════════════════════════════════════════════════════╗
║                    TACTICAL GROK IDE                         ║
║              Metal Gear Solid Inspired IDE                   ║
║                 with xAI Grok Integration                     ║
╚══════════════════════════════════════════════════════════════╝
```

*A tactical, dark-themed development environment with advanced AI capabilities*

</div>

## 🎯 MISSION OVERVIEW

The Tactical Grok IDE is a cutting-edge development environment inspired by the tactical interfaces of Metal Gear Solid. Built with a sleek black aesthetic and tactical green highlights, this IDE combines traditional coding capabilities with powerful AI assistance from xAI's Grok.

## ⚡ TACTICAL FEATURES

### 🖥️ **TACTICAL INTERFACE**
- **Dark Metal Gear Solid-inspired theme** with tactical green accents
- **Resizable panels** for customizable workspace layout
- **Advanced file explorer** with context menu operations
- **Multi-tab editor** with syntax highlighting indicators
- **Real-time status monitoring** with tactical status bar

### 🤖 **GROK AI INTEGRATION**
- **Multi-mode AI assistant** (Code, Image, Chat)
- **Code generation and analysis** with insertion capabilities
- **Image generation** using xAI's image models
- **Context-aware assistance** with file content integration
- **Tactical code formatting** with markdown support

### 📁 **FILE OPERATIONS**
- **Native file system access** using File System API
- **Create files and folders** directly from the interface
- **Auto-save functionality** with modification tracking
- **Batch save operations** for multiple files
- **Real-time file tree updates**

### 🎨 **CODE ENHANCEMENT**
- **AI-generated code insertion** directly into editor
- **File creation from AI code blocks** with proper extensions
- **Copy and insert operations** for generated content
- **Syntax-aware file icons** for better organization

## 🚀 DEPLOYMENT INSTRUCTIONS

### Prerequisites
- Node.js (v14 or higher)
- NPM (Node Package Manager)
- xAI API Key for Grok integration

### Installation

1. **Clone the tactical repository:**
```bash
git clone <repository-url>
cd tactical-grok-ide
```

2. **Install tactical dependencies:**
```bash
npm install
```

3. **Configure tactical environment:**
Create a `.env` file in the root directory:
```env
XAI_API_KEY=your_xai_api_key_here
PORT=3000
```

### Launch Sequence

1. **Start the tactical server:**
```bash
npm start
```

2. **Access the tactical interface:**
Open your browser and navigate to `http://localhost:3000`

3. **Begin tactical operations:**
- Click "OPEN FOLDER" to load your project
- Use the AI assistant for code generation and analysis
- Create and edit files with the tactical editor

## 🎮 TACTICAL CONTROLS

### File Operations
- **CTRL/CMD + S**: Save current file
- **CTRL/CMD + SHIFT + S**: Save all files
- **Right-click in explorer**: Context menu for file/folder creation

### AI Assistant
- **CTRL/CMD + Enter**: Send AI request
- **Mode switching**: Toggle between Code, Image, and Chat modes
- **Context inclusion**: Include current file content in AI requests

### Editor
- **Tab management**: Click tabs to switch files, × to close
- **Auto-save**: Automatic saving with modification indicators
- **Code insertion**: Direct insertion from AI-generated code blocks

## 🛠️ TACTICAL ARCHITECTURE

```
tactical-grok-ide/
├── public/
│   ├── tactical-ide.html      # Main tactical interface
│   └── dynamic-ide.html       # Legacy interface
├── server.js                  # Tactical server with AI endpoints
├── package.json              # Tactical dependencies
├── .env                      # Tactical configuration
└── README.md                 # Tactical documentation
```

## 🔧 API ENDPOINTS

### AI Operations
- `POST /api/completion` - Grok chat completions
- `POST /api/generate-image` - AI image generation
- `POST /api/analyze-code` - Code analysis and review
- `POST /api/analyze-project` - Project structure analysis

### System Operations
- `GET /api/health` - System status check
- `GET /` - Main tactical interface
- `GET /legacy` - Legacy interface access

## 🎨 TACTICAL THEME

The interface uses a carefully crafted color scheme:
- **Primary Black**: `#0a0a0a` - Main background
- **Secondary Black**: `#111111` - Panel backgrounds
- **Tertiary Black**: `#1a1a1a` - Component backgrounds
- **Tactical Green**: `#00ff41` - Accents and highlights
- **Border White**: `#333333` - Borders and separators

## 🔒 SECURITY PROTOCOLS

- Environment variable protection for API keys
- Request validation and sanitization
- Error handling with tactical feedback
- Secure file system operations

## 🚨 TROUBLESHOOTING

### Common Issues

**AI Features Not Working:**
- Verify XAI_API_KEY is set in .env file
- Check API key validity and permissions
- Ensure internet connection for AI requests

**File System Access Denied:**
- Use a modern browser supporting File System API
- Grant necessary permissions when prompted
- Ensure HTTPS in production environments

**Performance Issues:**
- Close unused tabs to free memory
- Limit AI context size for large files
- Use browser developer tools to monitor performance

## 🎯 TACTICAL OBJECTIVES

- [x] Dark tactical theme implementation
- [x] Multi-mode AI assistant integration
- [x] Advanced file operations
- [x] Code generation and insertion
- [x] Image generation capabilities
- [x] Resizable interface panels
- [x] Context menu operations
- [x] Real-time status monitoring

## 🤝 TACTICAL SUPPORT

For tactical support and feature requests:
1. Check the troubleshooting section
2. Review the API documentation
3. Submit tactical reports via issues

## 📜 TACTICAL LICENSE

This project is licensed under the MIT License - see the LICENSE file for tactical details.

## 🎖️ TACTICAL ACKNOWLEDGMENTS

- Inspired by Metal Gear Solid tactical interfaces
- Powered by xAI's Grok AI technology
- Built with modern web technologies
- Designed for tactical development operations

---

```
╔══════════════════════════════════════════════════════════════╗
║                    TACTICAL MISSION COMPLETE                 ║
║                   READY FOR DEPLOYMENT                       ║
╚══════════════════════════════════════════════════════════════╝
```

⚠️ **TACTICAL WARNING**: This project requires a valid xAI API key for full functionality. Keep your tactical credentials secure and never commit them to version control.