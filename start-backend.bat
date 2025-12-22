@echo off
REM Batch script to start the backend server
REM Usage: start-backend.bat

echo Starting Backend Server...
echo.

REM Navigate to backend directory
cd backend

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start the server
echo Starting backend server on port 5000...
call npm start

pause

