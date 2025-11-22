#!/bin/bash

# Grok IDE - Automated Setup Script
# This script handles common installation issues and sets up the environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions for colored output
print_header() {
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           GROK IDE - AUTOMATED SETUP SCRIPT                  ║${NC}"
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print header
print_header

# Step 1: Check Node.js installation
print_info "Checking Node.js installation..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"

    # Check if version is >= 14
    NODE_MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR_VERSION" -lt 14 ]; then
        print_error "Node.js version must be >= 14.x. Please update Node.js."
        print_info "Visit: https://nodejs.org/"
        exit 1
    fi
else
    print_error "Node.js not found. Please install Node.js >= 14.x"
    print_info "Visit: https://nodejs.org/"
    exit 1
fi

# Step 2: Check npm installation
print_info "Checking npm installation..."
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: v$NPM_VERSION"
else
    print_error "npm not found. Please install npm."
    exit 1
fi

# Step 3: Clean up previous installation attempts
print_info "Cleaning up previous installation attempts..."

if [ -d "node_modules" ]; then
    print_warning "Removing existing node_modules directory..."
    rm -rf node_modules
    print_success "node_modules removed"
fi

if [ -f "package-lock.json" ]; then
    print_warning "Removing existing package-lock.json..."
    rm -f package-lock.json
    print_success "package-lock.json removed"
fi

# Step 4: Fix npm cache issues
print_info "Fixing npm cache issues..."

print_info "Clearing npm cache..."
npm cache clean --force 2>/dev/null || {
    print_warning "Cache clean with warnings (this is usually okay)"
}
print_success "npm cache cleared"

print_info "Verifying npm cache..."
npm cache verify >/dev/null 2>&1 || {
    print_warning "Cache verification had warnings (proceeding anyway)"
}
print_success "npm cache verified"

# Step 5: Fix npm permissions (if needed)
print_info "Checking npm permissions..."

NPM_PREFIX=$(npm config get prefix)
if [ "$NPM_PREFIX" = "/usr/local" ] || [ "$NPM_PREFIX" = "/usr" ]; then
    print_warning "npm is using system directories. Fixing permissions..."

    # Create npm global directory in user home
    mkdir -p ~/.npm-global
    npm config set prefix ~/.npm-global 2>/dev/null || true

    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$HOME/.npm-global/bin:"* ]]; then
        print_info "Adding npm global bin to PATH..."

        # Detect shell
        if [ -n "$ZSH_VERSION" ]; then
            SHELL_CONFIG="$HOME/.zshrc"
        elif [ -n "$BASH_VERSION" ]; then
            SHELL_CONFIG="$HOME/.bashrc"
        else
            SHELL_CONFIG="$HOME/.profile"
        fi

        echo "" >> "$SHELL_CONFIG"
        echo "# npm global directory" >> "$SHELL_CONFIG"
        echo 'export PATH=~/.npm-global/bin:$PATH' >> "$SHELL_CONFIG"

        print_success "Added to $SHELL_CONFIG (reload shell after setup)"
    fi

    print_success "npm permissions configured"
else
    print_success "npm permissions look good"
fi

# Step 6: Install dependencies
print_info "Installing dependencies..."
echo ""

# Try npm install with retry logic
MAX_RETRIES=3
RETRY_COUNT=0
INSTALL_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$INSTALL_SUCCESS" = false ]; do
    if [ $RETRY_COUNT -gt 0 ]; then
        print_warning "Retry attempt $RETRY_COUNT of $MAX_RETRIES..."
        sleep 2
    fi

    if npm install --no-audit --no-fund 2>&1 | tee /tmp/npm-install.log; then
        INSTALL_SUCCESS=true
        print_success "Dependencies installed successfully!"
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            print_warning "Installation failed. Clearing cache and retrying..."
            npm cache clean --force 2>/dev/null
        fi
    fi
done

if [ "$INSTALL_SUCCESS" = false ]; then
    print_error "Installation failed after $MAX_RETRIES attempts"
    print_info "Please check the error log at: /tmp/npm-install.log"
    print_info "See INSTALL.md for manual troubleshooting steps"
    exit 1
fi

echo ""

# Step 7: Check for .env file
print_info "Checking environment configuration..."

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_success ".env file created"
        print_warning "⚠️  IMPORTANT: Edit .env and add your XAI_API_KEY"
    else
        print_warning ".env file not found. Creating default..."
        cat > .env << EOL
# xAI API Configuration
XAI_API_KEY=your_xai_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AI_RATE_LIMIT_WINDOW_MS=60000
AI_RATE_LIMIT_MAX_REQUESTS=20
EOL
        print_success ".env file created with defaults"
        print_warning "⚠️  IMPORTANT: Edit .env and add your XAI_API_KEY"
    fi
else
    print_success ".env file exists"

    # Check if API key is set
    if grep -q "XAI_API_KEY=your_xai_api_key_here" .env || grep -q "XAI_API_KEY=$" .env; then
        print_warning "⚠️  XAI_API_KEY is not set in .env file"
        print_info "Please edit .env and add your xAI API key"
    else
        print_success "XAI_API_KEY appears to be configured"
    fi
fi

echo ""

# Step 8: Verify installation
print_info "Verifying installation..."

if [ -d "node_modules" ]; then
    print_success "node_modules directory exists"
else
    print_error "node_modules directory not found!"
    exit 1
fi

# Count installed packages
PACKAGE_COUNT=$(ls node_modules | wc -l | tr -d ' ')
print_success "Installed $PACKAGE_COUNT packages"

echo ""

# Final success message
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              INSTALLATION COMPLETED SUCCESSFULLY!             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

print_info "Next steps:"
echo "  1. Edit .env file and add your XAI_API_KEY"
echo "  2. Start the development server:"
echo "     ${BLUE}npm run dev${NC}"
echo "  3. Open your browser:"
echo "     ${BLUE}http://localhost:3000${NC}"
echo ""

print_info "Available commands:"
echo "  ${BLUE}npm start${NC}        - Start production server"
echo "  ${BLUE}npm run dev${NC}      - Start development server with auto-reload"
echo "  ${BLUE}npm test${NC}         - Run tests"
echo "  ${BLUE}npm run test:e2e${NC} - Run end-to-end tests"
echo ""

print_info "Documentation:"
echo "  ${BLUE}README.md${NC}       - Project overview"
echo "  ${BLUE}INSTALL.md${NC}      - Installation troubleshooting"
echo "  ${BLUE}USERGUIDE.md${NC}    - User guide (if available)"
echo "  ${BLUE}tasks.md${NC}        - Development roadmap"
echo ""

# Check if shell config was modified
if [ -n "$SHELL_CONFIG" ] && grep -q "npm-global" "$SHELL_CONFIG" 2>/dev/null; then
    print_warning "Shell configuration was updated. Please run:"
    echo "  ${BLUE}source $SHELL_CONFIG${NC}"
    echo "  or restart your terminal"
    echo ""
fi

print_success "Setup complete! Happy coding! 🎮"
echo ""
