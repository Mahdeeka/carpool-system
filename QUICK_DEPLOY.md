# Quick Deploy - Carpool System

## 🚀 Fastest Way to Deploy

### Option 1: Use the All-in-One Script (Recommended)

**Windows:**
- Double-click `start-all.bat` OR
- Right-click `start-all.bat` → Run with PowerShell

**PowerShell:**
```powershell
.\start-all.ps1
```

This will:
- ✅ Check Node.js installation
- ✅ Install all dependencies automatically
- ✅ Start backend server (port 5000)
- ✅ Start frontend server (port 3000)

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm install  # First time only
npm start
```

**Terminal 2 - Frontend:**
```bash
npm install  # First time only
npm start
```

## 📋 Prerequisites

- **Node.js 14+** installed
  - Download: https://nodejs.org/
  - Verify: `node --version`

## 🌐 Access URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## ⚠️ Troubleshooting

**Node.js not found?**
- Install from https://nodejs.org/
- Restart terminal after installation

**Port already in use?**
- Backend: Change port in `backend/server.js`
- Frontend: React will prompt for alternative port

**Dependencies fail?**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📚 More Help

- See `DEPLOYMENT_GUIDE.md` for detailed instructions
- See `QUICK_START.md` for testing the app features

