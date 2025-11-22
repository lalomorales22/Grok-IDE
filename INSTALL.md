# Grok IDE - Installation Guide

## Quick Start (Recommended)

We've created an automated setup script to handle common installation issues:

```bash
# macOS/Linux
chmod +x setup.sh
./setup.sh

# Windows
.\setup.bat
```

## Manual Installation

### Prerequisites

- **Node.js**: v14 or higher (v18+ recommended)
- **npm**: 6.x or higher
- **xAI API Key**: Required for AI features

### Step-by-Step Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd Grok-IDE
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment

Create a `.env` file in the root directory:

```env
XAI_API_KEY=your_xai_api_key_here
PORT=3000
NODE_ENV=development
```

You can copy from the example:
```bash
cp .env.example .env
# Then edit .env with your API key
```

#### 4. Start the Application

```bash
# Production mode
npm start

# Development mode with auto-reload
npm run dev
```

#### 5. Access the IDE

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🔧 Troubleshooting Common Installation Errors

### Error: EEXIST / EACCES (npm cache corruption)

**Symptoms:**
```
npm error code EEXIST
npm error syscall rename
npm error errno EACCES
npm error Invalid response body while trying to fetch...
```

**Solution 1: Clear npm cache (Recommended)**
```bash
# Clear npm cache completely
npm cache clean --force

# Verify cache is clean
npm cache verify

# Try installation again
npm install
```

**Solution 2: Clean install**
```bash
# Remove existing installation files
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Fresh install
npm install
```

**Solution 3: Fix npm cache permissions (macOS/Linux)**
```bash
# Fix ownership of npm directories
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Clear cache and reinstall
npm cache clean --force
npm install
```

**Solution 4: Use different npm cache location (Temporary fix)**
```bash
# Install with a clean cache directory
npm install --cache /tmp/npm-cache
```

**Solution 5: Update npm**
```bash
# Update npm to latest version
npm install -g npm@latest

# Clear cache and retry
npm cache clean --force
npm install
```

---

### Error: ENOTFOUND / Network Issues

**Symptoms:**
```
npm error code ENOTFOUND
npm error network request failed
```

**Solutions:**
```bash
# Option 1: Check your internet connection
ping registry.npmjs.org

# Option 2: Clear DNS cache (macOS)
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Option 3: Use different npm registry
npm config set registry https://registry.npmjs.org/
npm install

# Option 4: Install with verbose logging to see what's failing
npm install --verbose
```

---

### Error: gyp ERR! (Native module build failures)

**Symptoms:**
```
gyp ERR! build error
gyp ERR! stack Error: `make` failed with exit code: 2
```

**Solutions:**

**macOS:**
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Then retry installation
npm install
```

**Linux (Ubuntu/Debian):**
```bash
# Install build essentials
sudo apt-get update
sudo apt-get install build-essential

# Then retry installation
npm install
```

**Windows:**
```bash
# Install windows-build-tools
npm install --global windows-build-tools

# Then retry installation
npm install
```

---

### Error: ENOSPC (No space left on device)

**Solutions:**

**Linux:**
```bash
# Increase inotify watchers limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Then retry installation
npm install
```

---

### Error: Permission Denied (EACCES)

**Solutions:**

**macOS/Linux (Don't use sudo!):**
```bash
# Fix npm global directory permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export PATH=~/.npm-global/bin:$PATH

# Reload shell configuration
source ~/.bashrc  # or source ~/.zshrc

# Then retry installation
npm install
```

---

### Error: Incompatible Node Version

**Symptoms:**
```
npm error engine Unsupported engine
```

**Solutions:**
```bash
# Check your Node.js version
node --version

# If version is < 14, update Node.js
# Using nvm (recommended):
nvm install 18
nvm use 18

# Or download from https://nodejs.org/
```

---

### Error: Missing Dependencies After Install

**Solutions:**
```bash
# Force rebuild all native modules
npm rebuild

# Or try installing with legacy peer deps
npm install --legacy-peer-deps

# Or with force flag
npm install --force
```

---

## 🧪 Verify Installation

After successful installation, run these commands to verify everything works:

```bash
# Check if all dependencies are installed
npm list --depth=0

# Run tests
npm test

# Start the development server
npm run dev
```

---

## 🐳 Alternative: Docker Installation

If npm installation continues to fail, you can use Docker:

```bash
# Build Docker image
docker-compose build

# Start the application
docker-compose up -d

# Access at http://localhost:3000
```

---

## 📦 Installation Script Issues

If the automated setup script fails:

**macOS/Linux:**
```bash
# Make script executable
chmod +x setup.sh

# Run with bash explicitly
bash setup.sh

# Or run with verbose output
bash -x setup.sh
```

**Windows:**
```bash
# If .bat file doesn't work, try PowerShell script
powershell -ExecutionPolicy Bypass -File setup.ps1
```

---

## 🔍 Still Having Issues?

1. **Check the error logs:**
   ```bash
   # npm logs location (macOS/Linux)
   cat ~/.npm/_logs/*-debug-*.log

   # Windows
   type %APPDATA%\npm-cache\_logs\*-debug-*.log
   ```

2. **Get detailed error information:**
   ```bash
   npm install --verbose --loglevel silly
   ```

3. **Try with a clean environment:**
   ```bash
   # Use npx to avoid global installations
   npx create-grok-ide my-grok-ide
   ```

4. **Report the issue:**
   - Include your Node.js version: `node --version`
   - Include your npm version: `npm --version`
   - Include your OS: `uname -a` (Unix) or `ver` (Windows)
   - Include the full error log
   - Create an issue at: https://github.com/lalomorales22/Grok-IDE/issues

---

## ✅ Post-Installation Steps

Once installation is successful:

1. **Configure your xAI API key** in `.env`
2. **Start the server**: `npm start`
3. **Open browser**: Navigate to `http://localhost:3000`
4. **Test AI features**: Click "OPEN FOLDER" and try the AI assistant
5. **Review documentation**: Check [USERGUIDE.md](./USERGUIDE.md) for features

---

## 🚀 Next Steps

- [Read the User Guide](./USERGUIDE.md)
- [Check the Architecture Documentation](./src/README.md)
- [Review the Upgrade Roadmap](./tasks.md)
- [Explore Available Themes](./README.md#-theme)

---

## 💡 Quick Tips

- **Always use the latest LTS version of Node.js**
- **Never use `sudo npm install` unless absolutely necessary**
- **Keep npm updated**: `npm install -g npm@latest`
- **Use `npm ci` instead of `npm install` for faster, cleaner installs** (if you have package-lock.json)
- **Clear cache regularly if you face frequent issues**: `npm cache clean --force`

---

**Happy Coding! 🎮**
