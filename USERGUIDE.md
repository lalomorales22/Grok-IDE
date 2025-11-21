# Grok IDE - Comprehensive User Guide

> **Version 5.0.0** | Production-Ready Development Environment with AI Integration

Welcome to Grok IDE, a cutting-edge development environment inspired by the Metal Gear Solid aesthetic, powered by xAI's Grok AI. This guide will help you master all features of the IDE.

---

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [File Management](#file-management)
4. [Code Editor](#code-editor)
5. [AI Assistant](#ai-assistant)
6. [Git Integration](#git-integration)
7. [Terminal](#terminal)
8. [Developer Tools](#developer-tools)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Themes & Customization](#themes--customization)
11. [Advanced Features](#advanced-features)
12. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 14+ installed
- Modern browser (Chrome, Firefox, Safari, Edge)
- xAI API key (get one at [x.ai](https://x.ai))

### Installation

#### Option 1: Standard Installation

```bash
# Clone the repository
git clone <repository-url>
cd grok-ide

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your XAI_API_KEY

# Start the server
npm start
```

#### Option 2: Docker Installation

```bash
# Using Docker
docker build -t grok-ide .
docker run -p 3000:3000 --env-file .env grok-ide

# Or using Docker Compose
docker-compose up -d
```

### First Launch

1. Open your browser and navigate to `http://localhost:3000`
2. You'll see the Grok IDE welcome screen
3. Click **"OPEN FOLDER"** to load your project
4. Grant file system permissions when prompted

---

## 🖥️ Interface Overview

### Main Layout

The Grok IDE interface consists of several key areas:

```
┌──────────────────────────────────────────────────┐
│  NAVBAR (Top bar with tools and settings)        │
├──────┬───────────────────────────────────────────┤
│      │                                           │
│ FILE │         EDITOR AREA                       │
│ TREE │     (Multiple tabs supported)             │
│      │                                           │
│      ├───────────────────────────────────────────┤
│      │         BOTTOM PANEL                      │
│      │   Terminal | Console | Tasks             │
└──────┴───────────────────────────────────────────┘
```

### Navigation Bar

- **File Menu**: New file, open folder, save operations
- **Tools Menu**: Access to developer tools
- **AI Mode Selector**: Switch between Code, Chat, Image, Review modes
- **Settings**: Theme, preferences, and configuration
- **Status Indicators**: Online/offline, git status

### File Explorer (Left Sidebar)

- Browse project files and folders
- Right-click for context menu operations
- Drag-and-drop file management
- File search and filtering

### Editor Area (Center)

- Multi-tab editing with Monaco Editor
- Syntax highlighting for 20+ languages
- IntelliSense and autocomplete
- Code folding and minimap
- Find and replace

### AI Chat Panel (Right)

- Conversation with Grok AI
- Mode-specific responses
- Context management
- Conversation history

### Bottom Panel

- **Terminal**: Integrated xterm.js terminal
- **Console**: Developer console for logs
- **Tasks**: TODO and task management

---

## 📁 File Management

### Opening a Project

1. Click **"OPEN FOLDER"** in the navbar
2. Select your project directory
3. Grant permissions when prompted
4. Files appear in the left sidebar

### Creating Files and Folders

**Method 1: Context Menu**
- Right-click in the file tree
- Select "New File" or "New Folder"
- Enter the name and press Enter

**Method 2: Keyboard**
- Press `Ctrl+N` for new file
- Use the command palette (`Ctrl+K`) → "New File"

### File Operations

- **Save**: `Ctrl+S` (saves current file)
- **Save All**: `Ctrl+Shift+S` (saves all modified files)
- **Delete**: Right-click → Delete
- **Rename**: Right-click → Rename
- **Duplicate**: Right-click → Duplicate

### Recent Files

- Access recent files via the file menu
- Shows last 10 opened files
- Quick access to frequently used files

### Favorites

- Star important files for quick access
- Access via the sidebar favorites section
- Synced to localStorage

### File Templates

Quick-start with pre-built templates:
- HTML5 Document
- React Component
- Express API Server
- Python Script
- TypeScript Node App

Access via `Ctrl+Shift+P` → "New from Template"

---

## 💻 Code Editor

### Monaco Editor Features

Grok IDE uses Monaco Editor (the same engine powering VS Code):

#### IntelliSense

- Automatic code suggestions
- Context-aware completions
- Parameter hints
- Type information

#### Multi-Cursor Editing

- `Alt+Click`: Add cursor at position
- `Ctrl+Alt+↓/↑`: Add cursor above/below
- `Ctrl+D`: Select next occurrence
- `Ctrl+Shift+L`: Select all occurrences

#### Code Navigation

- `F12`: Go to Definition
- `Alt+F12`: Peek Definition
- `Shift+F12`: Find All References
- `Ctrl+Shift+O`: Go to Symbol

#### Code Formatting

- `Shift+Alt+F`: Format document
- `Ctrl+K Ctrl+F`: Format selection
- Automatic formatting on save (configurable)

#### Code Folding

- Click the folding icons in the gutter
- `Ctrl+Shift+[`: Fold region
- `Ctrl+Shift+]`: Unfold region
- `Ctrl+K Ctrl+0`: Fold all
- `Ctrl+K Ctrl+J`: Unfold all

#### Find and Replace

- `Ctrl+F`: Find
- `Ctrl+H`: Replace
- `Alt+Enter`: Select all occurrences
- Regex support with `/pattern/` syntax

---

## 🤖 AI Assistant

### AI Modes

Grok IDE offers multiple AI interaction modes:

#### 1. Code Mode
- **Purpose**: Code generation and completion
- **Use Cases**:
  - Generate functions
  - Debug code
  - Refactor code
  - Add comments
- **Example**: "Create a function to validate email addresses"

#### 2. Chat Mode
- **Purpose**: General conversation and Q&A
- **Use Cases**:
  - Ask programming questions
  - Get explanations
  - Learn concepts
  - Brainstorm ideas
- **Example**: "Explain the difference between let and const"

#### 3. Image Mode
- **Purpose**: Generate images using AI
- **Use Cases**:
  - Create UI mockups
  - Generate icons
  - Design assets
- **Example**: "Generate a dark-themed login screen"

#### 4. Review Mode
- **Purpose**: Code review and analysis
- **Use Cases**:
  - Security audit
  - Performance analysis
  - Best practices check
  - Bug detection
- **Example**: "Review this code for security vulnerabilities"

### Using the AI Assistant

1. **Select Mode**: Choose appropriate mode from dropdown
2. **Include Context**: Toggle "Include file content" to send current file
3. **Type Request**: Enter your question or request
4. **Send**: Press `Ctrl+Enter` or click Send
5. **View Response**: Real-time streaming response appears
6. **Insert Code**: Click "Insert" button on code blocks

### Conversation History

- View past conversations
- Search through history
- Export conversations as JSON
- Clear history when needed

Access via `Ctrl+Shift+H` or AI Panel → History

### AI Context Management

- Token counter shows current context size
- Manage multi-file context
- Clear context to start fresh
- Model selection (grok-beta, grok-vision-beta)

---

## 🔀 Git Integration

### Initialize Repository

```bash
# Via Terminal
git init

# Via UI
Git Panel → "Initialize Repository"
```

### Git Status

- View changed files in Git panel
- File indicators show modifications
- See staged vs unstaged changes

### Staging Changes

1. Open Git panel
2. Click **"+"** next to files to stage
3. Or click **"Stage All"** to stage everything

### Committing

1. Stage your changes
2. Enter commit message
3. Click **"Commit"**
4. Optionally push to remote

### Branches

- **View Branches**: Git panel → Branches tab
- **Create Branch**: Click "New Branch"
- **Switch Branch**: Click on branch name
- **Delete Branch**: Right-click → Delete

### Push and Pull

- **Push**: Git panel → "Push" button
- **Pull**: Git panel → "Pull" button
- **Sync**: Automatically pull then push

### Commit History

- View commit log in Git panel
- See commit details, author, date
- Click to view commit changes

---

## 🖥️ Terminal

### Opening the Terminal

- Press `Ctrl+\`` (backtick)
- Or click Terminal icon in bottom panel
- Or use command palette → "Toggle Terminal"

### Multiple Terminals

- Click **"+"** in terminal tab bar
- Create multiple terminal instances
- Switch between terminals with tabs

### Terminal Features

- Full xterm.js terminal emulator
- Command history (↑/↓ arrows)
- Copy/paste support
- Clickable links
- Theme matches IDE theme

### Built-in Commands

The terminal includes some built-in commands:

```bash
help       # Show available commands
clear      # Clear terminal
date       # Show current date/time
echo       # Print text
cowsay     # ASCII art (fun!)
```

---

## 🔧 Developer Tools

### JSON/XML Formatter

Format and validate JSON or XML:

1. Press `Ctrl+Shift+J`
2. Paste JSON/XML content
3. Click **"Format"** or **"Validate"**
4. Optionally minify

### API Tester

Test REST APIs directly:

1. Press `Ctrl+Shift+A`
2. Enter URL and select method (GET, POST, etc.)
3. Add headers, query params, body
4. Click **"Send Request"**
5. View response with syntax highlighting

### Code Snippets

Access 25+ built-in snippets:

1. Press `Ctrl+Shift+S`
2. Browse by category:
   - JavaScript
   - React
   - HTML
   - CSS
   - Python
3. Click to insert into editor

### Task Manager

Manage TODOs and tasks:

1. Press `Ctrl+Shift+T`
2. Add task with description
3. Set priority (High, Medium, Low)
4. Mark complete when done
5. Filter by status or priority

### Markdown Preview

Live preview for Markdown files:

1. Open a `.md` file
2. Press `Ctrl+Shift+M`
3. View side-by-side preview
4. Auto-refreshes on edit

### Developer Console

View application logs:

1. Press `Ctrl+Shift+C`
2. Filter by type (log, warn, error, info)
3. Clear logs as needed
4. Export logs for debugging

---

## ⌨️ Keyboard Shortcuts

### General

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open Command Palette |
| `Ctrl+,` | Open Settings |
| `F11` | Toggle Zen Mode |
| `Ctrl+B` | Toggle Sidebar |

### File Operations

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New File |
| `Ctrl+O` | Open Folder |
| `Ctrl+S` | Save File |
| `Ctrl+Shift+S` | Save All |
| `Ctrl+W` | Close Tab |
| `Ctrl+P` | Quick File Switcher |

### Editor

| Shortcut | Action |
|----------|--------|
| `Ctrl+F` | Find |
| `Ctrl+H` | Replace |
| `Ctrl+D` | Select Next Occurrence |
| `Alt+Click` | Add Cursor |
| `Shift+Alt+F` | Format Document |
| `F12` | Go to Definition |

### AI Assistant

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Send AI Request |
| `Ctrl+Shift+H` | View History |

### Tools

| Shortcut | Action |
|----------|--------|
| `Ctrl+\`` | Toggle Terminal |
| `Ctrl+Shift+C` | Toggle Console |
| `Ctrl+Shift+T` | Open Tasks |
| `Ctrl+Shift+M` | Markdown Preview |
| `Ctrl+Shift+J` | JSON Formatter |
| `Ctrl+Shift+S` | Code Snippets |
| `Ctrl+Shift+A` | API Tester |
| `Ctrl+Shift+P` | Project Templates |

### Git

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+G` | Open Git Panel |

### Customization

All shortcuts can be customized in Settings → Keyboard Shortcuts

---

## 🎨 Themes & Customization

### Available Themes

Grok IDE includes 6 beautiful themes:

1. **Metal Gear** (Default) - Dark with white accents
2. **Cyberpunk** - Vibrant neon colors
3. **Matrix** - Green terminal aesthetic
4. **Light** - Clean light theme
5. **Nord** - Soft, arctic color palette
6. **Dracula** - Popular purple-tinted dark theme

### Changing Themes

- **Quick Switch**: Settings → Theme dropdown
- **Command Palette**: `Ctrl+K` → "Change Theme"
- **Keyboard**: Cycle themes with theme shortcuts

### Theme Customization

Advanced users can customize themes:

1. Open Settings
2. Navigate to Appearance
3. Edit theme colors
4. Export/Import custom themes

### Font Settings

Customize editor font:
- Font Family
- Font Size (10-24px)
- Line Height
- Letter Spacing

### Layout Preferences

- Panel sizes (resizable with drag handles)
- Show/hide components
- Default panel positions
- Workspace layouts

---

## 🚀 Advanced Features

### PWA Installation

Grok IDE can be installed as a Progressive Web App:

1. Click the install icon in the address bar
2. Or look for "Install Grok IDE" button
3. Access like a native app
4. Works offline with cached files

### Offline Mode

- Service worker caches essential files
- Continue editing without internet
- AI features require connection
- Changes sync when back online

### Project Templates

Quick-start new projects:

1. Press `Ctrl+Shift+P`
2. Select template type
3. Enter project details
4. Files are scaffolded automatically

Available templates:
- HTML5 Basic
- React Component
- Express API Server
- Python Script
- TypeScript Node App

### Global Search

Search across all files:

1. Press `Ctrl+Shift+F`
2. Enter search term
3. Use regex or case-sensitive options
4. View results with context
5. Click to jump to location

### Multi-File Context (AI)

Send multiple files to AI:

1. Select files in explorer
2. Enable multi-file context
3. AI can see all selected files
4. Better for project-wide questions

---

## 🐛 Troubleshooting

### Common Issues

#### AI Features Not Working

**Problem**: AI requests fail or timeout

**Solutions**:
1. Verify `XAI_API_KEY` in `.env` file
2. Check API key validity at x.ai
3. Ensure internet connection
4. Check rate limits (20 requests/minute)

#### File System Access Denied

**Problem**: Cannot open folder or save files

**Solutions**:
1. Use Chrome, Edge, or modern browser
2. Grant permissions when prompted
3. Check browser security settings
4. Try using HTTPS in production

#### Performance Issues

**Problem**: IDE feels slow or laggy

**Solutions**:
1. Close unused tabs (click × on tabs)
2. Clear browser cache
3. Reduce AI context size
4. Disable unused features
5. Use browser dev tools to check memory

#### Terminal Not Working

**Problem**: Terminal commands fail

**Solutions**:
1. Refresh the page
2. Create new terminal instance
3. Check browser console for errors

### Getting Help

1. Check this user guide
2. Review the [README.md](README.md)
3. Check [GitHub Issues](https://github.com/your-repo/issues)
4. Contact support team

---

## 📊 Performance Tips

### Optimize Editor Performance

- Limit open tabs to 5-10
- Use code folding for large files
- Disable minimap for huge files
- Close unused panels

### Optimize AI Usage

- Be specific in requests
- Use appropriate mode
- Limit context size
- Clear history periodically

### Browser Optimization

- Use Chrome or Edge for best performance
- Keep browser updated
- Clear cache regularly
- Disable unnecessary extensions

---

## 🔒 Security Best Practices

1. **Never commit** `.env` file to version control
2. **Rotate API keys** regularly
3. **Use HTTPS** in production
4. **Keep dependencies** updated (`npm audit`)
5. **Review AI-generated code** before using
6. **Limit file permissions** to necessary directories

---

## 📚 Additional Resources

- [API Documentation](API.md) - Backend API reference
- [Architecture Guide](src/README.md) - Codebase structure
- [Development Guide](CONTRIBUTING.md) - Contributing guidelines
- [Changelog](CHANGELOG.md) - Version history

---

## 🎓 Learning Path

### Beginner

1. Open a project folder
2. Create and edit files
3. Use basic AI features
4. Try different themes

### Intermediate

1. Master keyboard shortcuts
2. Use Git integration
3. Explore developer tools
4. Customize settings

### Advanced

1. Use multi-file AI context
2. Create custom themes
3. Utilize project templates
4. Integrate with workflows

---

## 💡 Tips & Tricks

### Pro Tips

1. **Command Palette**: `Ctrl+K` is your friend - access any command
2. **Quick Files**: `Ctrl+P` for instant file switching
3. **Multi-cursor**: `Ctrl+D` to edit multiple instances
4. **AI Context**: Include relevant files for better AI responses
5. **Snippets**: Learn common snippets to boost productivity
6. **Zen Mode**: `F11` for distraction-free coding

### Workflow Optimization

1. Create file templates for recurring patterns
2. Use favorites for frequently accessed files
3. Organize tasks for better project management
4. Leverage AI for code review and debugging
5. Use git integration for version control

---

## 📞 Support

For support and feature requests:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Email: support@example.com
- Discord: [Join our server](https://discord.gg/your-server)

---

**Enjoy coding with Grok IDE!** 🚀

*Last updated: November 2025 | Version 5.0.0*
