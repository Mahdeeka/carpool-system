@echo off
REM Batch script to start the frontend server
REM Usage: start-frontend.bat

echo Starting Frontend Server...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start the development server
echo Starting frontend server on port 3000...
echo The app will open automatically in your browser
call npm start

pause

