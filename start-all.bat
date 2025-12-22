@echo off
REM Batch script to start both frontend and backend servers
REM Usage: start-all.bat
REM Note: This opens two separate command prompt windows

echo Setting up Carpool System...
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

node --version
npm --version
echo.

REM Install frontend dependencies if needed
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo Error: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

REM Install backend dependencies if needed
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    if errorlevel 1 (
        echo Error: Failed to install backend dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting servers...
echo.

REM Start backend in a new window
echo Opening backend server window...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm start"

REM Wait a moment for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend in a new window
echo Opening frontend server window...
start "Frontend Server" cmd /k "cd /d %~dp0 && npm start"

echo.
echo Both servers are starting in separate windows
echo    Backend: http://localhost:5000
echo    Frontend: http://localhost:3000
echo.
pause

