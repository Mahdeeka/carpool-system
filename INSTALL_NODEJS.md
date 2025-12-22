# Install Node.js to Run the Application

## Node.js is Required

The Carpool System requires Node.js to run. Please install it first.

## Quick Installation

### Option 1: Download Installer (Recommended)
1. Go to: https://nodejs.org/
2. Download the **LTS version** (Long Term Support)
3. Run the installer
4. Follow the installation wizard (accept defaults)
5. **Restart your terminal/command prompt** after installation
6. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Option 2: Using Chocolatey (if you have it)
```powershell
choco install nodejs
```

### Option 3: Using Winget (Windows 10/11)
```powershell
winget install OpenJS.NodeJS.LTS
```

## After Installation

1. **Close and reopen** your terminal/command prompt
2. Verify Node.js is installed:
   ```bash
   node --version
   npm --version
   ```
3. Navigate to the project:
   ```bash
   cd carpool-system.tar/carpool-system
   ```
4. Run the start script:
   ```bash
   .\start-all.bat
   ```
   OR
   ```powershell
   .\start-all.ps1
   ```

## What Node.js Includes

- **Node.js** - JavaScript runtime
- **npm** - Package manager (comes with Node.js)

Both are needed to run the application.

