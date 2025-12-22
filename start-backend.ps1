# PowerShell script to start the backend server
# Usage: .\start-backend.ps1

Write-Host "Starting Backend Server..." -ForegroundColor Green
Write-Host ""

# Navigate to backend directory
Set-Location -Path "backend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Start the server
Write-Host "Starting backend server on port 5000..." -ForegroundColor Cyan
npm start

