# PowerShell script to start the frontend server
# Usage: .\start-frontend.ps1

Write-Host "Starting Frontend Server..." -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Start the development server
Write-Host "Starting frontend server on port 3000..." -ForegroundColor Cyan
Write-Host "The app will open automatically in your browser" -ForegroundColor Yellow
npm start

