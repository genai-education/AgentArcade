@echo off
echo.
echo ========================================
echo    Agent Arcades - Local Server (Port 6000)
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Python found! Starting Python server on port 6000...
    echo.
    echo 🌐 Server will be available at: http://localhost:6000
    echo 📱 Open this URL in your browser to access Agent Arcades
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server 6000
    goto :end
)

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Node.js found! Installing and starting server on port 6000...
    echo.
    echo 🌐 Server will be available at: http://localhost:6000
    echo 📱 Open this URL in your browser to access Agent Arcades
    echo.
    npx serve . -p 6000
    goto :end
)

REM Check if PHP is available
php --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ PHP found! Starting PHP server on port 6000...
    echo.
    echo 🌐 Server will be available at: http://localhost:6000
    echo 📱 Open this URL in your browser to access Agent Arcades
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    php -S localhost:6000
    goto :end
)

REM No server found
echo ❌ No suitable server found!
echo.
echo 💡 Solutions:
echo.
echo 1. Install Python: https://python.org/downloads
echo    Then run: python -m http.server 6000
echo.
echo 2. Install Node.js: https://nodejs.org
echo    Then run: npx serve . -p 6000
echo.
echo 3. Use the standalone version:
echo    Open "index-standalone.html" directly in your browser
echo.
echo 4. Use VS Code with Live Server extension (configure port 6000)
echo.
pause

:end
echo.
echo Server stopped. Press any key to exit...
pause >nul
