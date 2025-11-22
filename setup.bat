@echo off
REM Grok IDE - Automated Setup Script for Windows
REM This script handles common installation issues and sets up the environment

setlocal enabledelayedexpansion

REM Colors are limited in Windows CMD, but we can use echo for structure
echo ================================================================
echo           GROK IDE - AUTOMATED SETUP SCRIPT
echo ================================================================
echo.

REM Step 1: Check Node.js installation
echo [INFO] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Please install Node.js ^>= 14.x
    echo [INFO] Visit: https://nodejs.org/
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js found: %NODE_VERSION%

REM Step 2: Check npm installation
echo [INFO] Checking npm installation...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm not found. Please install npm.
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [SUCCESS] npm found: v%NPM_VERSION%
echo.

REM Step 3: Clean up previous installation attempts
echo [INFO] Cleaning up previous installation attempts...

if exist "node_modules" (
    echo [WARNING] Removing existing node_modules directory...
    rmdir /s /q node_modules 2>nul
    echo [SUCCESS] node_modules removed
)

if exist "package-lock.json" (
    echo [WARNING] Removing existing package-lock.json...
    del /f /q package-lock.json 2>nul
    echo [SUCCESS] package-lock.json removed
)
echo.

REM Step 4: Fix npm cache issues
echo [INFO] Fixing npm cache issues...

echo [INFO] Clearing npm cache...
call npm cache clean --force 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] npm cache cleared
) else (
    echo [WARNING] Cache clean had warnings ^(proceeding anyway^)
)

echo [INFO] Verifying npm cache...
call npm cache verify >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] npm cache verified
) else (
    echo [WARNING] Cache verification had warnings ^(proceeding anyway^)
)
echo.

REM Step 5: Install dependencies
echo [INFO] Installing dependencies...
echo.

REM Try npm install with retry logic
set MAX_RETRIES=3
set RETRY_COUNT=0
set INSTALL_SUCCESS=0

:INSTALL_LOOP
if %RETRY_COUNT% GTR 0 (
    echo [WARNING] Retry attempt %RETRY_COUNT% of %MAX_RETRIES%...
    timeout /t 2 /nobreak >nul
)

call npm install --no-audit --no-fund
if %ERRORLEVEL% EQU 0 (
    set INSTALL_SUCCESS=1
    echo [SUCCESS] Dependencies installed successfully!
    goto INSTALL_DONE
) else (
    set /a RETRY_COUNT+=1
    if !RETRY_COUNT! LSS %MAX_RETRIES% (
        echo [WARNING] Installation failed. Clearing cache and retrying...
        call npm cache clean --force 2>nul
        goto INSTALL_LOOP
    )
)

:INSTALL_DONE
if %INSTALL_SUCCESS% EQU 0 (
    echo [ERROR] Installation failed after %MAX_RETRIES% attempts
    echo [INFO] See INSTALL.md for manual troubleshooting steps
    exit /b 1
)
echo.

REM Step 6: Check for .env file
echo [INFO] Checking environment configuration...

if not exist ".env" (
    if exist ".env.example" (
        echo [WARNING] .env file not found. Creating from .env.example...
        copy .env.example .env >nul
        echo [SUCCESS] .env file created
        echo [WARNING] IMPORTANT: Edit .env and add your XAI_API_KEY
    ) else (
        echo [WARNING] .env file not found. Creating default...
        (
            echo # xAI API Configuration
            echo XAI_API_KEY=your_xai_api_key_here
            echo.
            echo # Server Configuration
            echo PORT=3000
            echo NODE_ENV=development
            echo.
            echo # Security
            echo ALLOWED_ORIGINS=http://localhost:3000
            echo.
            echo # Rate Limiting
            echo RATE_LIMIT_WINDOW_MS=900000
            echo RATE_LIMIT_MAX_REQUESTS=100
            echo AI_RATE_LIMIT_WINDOW_MS=60000
            echo AI_RATE_LIMIT_MAX_REQUESTS=20
        ) > .env
        echo [SUCCESS] .env file created with defaults
        echo [WARNING] IMPORTANT: Edit .env and add your XAI_API_KEY
    )
) else (
    echo [SUCCESS] .env file exists

    REM Check if API key is set
    findstr /C:"XAI_API_KEY=your_xai_api_key_here" .env >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [WARNING] XAI_API_KEY is not set in .env file
        echo [INFO] Please edit .env and add your xAI API key
    ) else (
        findstr /C:"XAI_API_KEY=$" .env >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            echo [WARNING] XAI_API_KEY is not set in .env file
            echo [INFO] Please edit .env and add your xAI API key
        ) else (
            echo [SUCCESS] XAI_API_KEY appears to be configured
        )
    )
)
echo.

REM Step 7: Verify installation
echo [INFO] Verifying installation...

if exist "node_modules" (
    echo [SUCCESS] node_modules directory exists
) else (
    echo [ERROR] node_modules directory not found!
    exit /b 1
)

REM Count installed packages
for /f %%i in ('dir /b /a:d node_modules ^| find /c /v ""') do set PACKAGE_COUNT=%%i
echo [SUCCESS] Installed %PACKAGE_COUNT% packages
echo.

REM Final success message
echo ================================================================
echo              INSTALLATION COMPLETED SUCCESSFULLY!
echo ================================================================
echo.

echo [INFO] Next steps:
echo   1. Edit .env file and add your XAI_API_KEY
echo   2. Start the development server:
echo      npm run dev
echo   3. Open your browser:
echo      http://localhost:3000
echo.

echo [INFO] Available commands:
echo   npm start        - Start production server
echo   npm run dev      - Start development server with auto-reload
echo   npm test         - Run tests
echo   npm run test:e2e - Run end-to-end tests
echo.

echo [INFO] Documentation:
echo   README.md        - Project overview
echo   INSTALL.md       - Installation troubleshooting
echo   USERGUIDE.md     - User guide ^(if available^)
echo   tasks.md         - Development roadmap
echo.

echo [SUCCESS] Setup complete! Happy coding!
echo.

pause
