# Local Deployment Guide

This guide will help you deploy the Carpool System application on your local machine.

## Prerequisites

1. **Node.js** (version 14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: Open a new terminal and run:
     ```bash
     node --version
     npm --version
     ```

## Step-by-Step Deployment

### Step 1: Navigate to Project Directory

Open a terminal/command prompt and navigate to the project directory:

```bash
cd carpool-system.tar/carpool-system
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

This will install all React dependencies. Wait for it to complete (may take a few minutes).

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### Step 4: (Optional) Create Environment File

Create a `.env` file in the root directory (same level as `package.json`):

```env
REACT_APP_API_URL=http://localhost:5000/api
```

**Note:** This is optional as the default is already set to `http://localhost:5000/api` in the code.

### Step 5: Start the Backend Server

Open a **new terminal window** and run:

```bash
cd carpool-system.tar/carpool-system/backend
npm start
```

You should see:
```
🚀 Server running on port 5000
📡 API available at http://localhost:5000/api
📦 Using in-memory storage
```

**Keep this terminal window open** - the backend server must stay running.

### Step 6: Start the Frontend Development Server

In the **original terminal window** (or a new one), run:

```bash
cd carpool-system.tar/carpool-system
npm start
```

This will:
- Start the React development server
- Automatically open your browser to `http://localhost:3000`
- Enable hot-reloading (changes will refresh automatically)

### Step 7: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## Quick Start Scripts

### Windows (PowerShell)

**Start Backend:**
```powershell
cd backend; npm start
```

**Start Frontend:**
```powershell
npm start
```

### Windows (Command Prompt)

**Start Backend:**
```cmd
cd backend && npm start
```

**Start Frontend:**
```cmd
npm start
```

### Linux/Mac

**Start Backend:**
```bash
cd backend && npm start
```

**Start Frontend:**
```bash
npm start
```

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use:

**For Backend (port 5000):**
- Edit `backend/server.js`
- Change: `const PORT = process.env.PORT || 5000;` to another port (e.g., `5001`)
- Update `.env` file: `REACT_APP_API_URL=http://localhost:5001/api`

**For Frontend (port 3000):**
- The React dev server will prompt you to use a different port
- Or set: `PORT=3001 npm start`

### Node.js Not Found

1. Install Node.js from https://nodejs.org/
2. Restart your terminal after installation
3. Verify with: `node --version` and `npm --version`

### Dependencies Installation Fails

1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` folder and `package-lock.json`
3. Run `npm install` again

### Backend Not Connecting

1. Ensure backend is running on port 5000
2. Check `REACT_APP_API_URL` in `.env` file
3. Verify CORS is enabled in `backend/server.js` (it should be by default)

## Testing the Application

1. **Create an Event:**
   - Go to http://localhost:3000
   - Click "Admin Login"
   - Password: `admin123` (development only)
   - Create an event and note the event code

2. **Test as Driver:**
   - Enter the event code
   - Click "Offer Carpool"
   - Fill in driver details and submit

3. **Test as Passenger:**
   - Enter the same event code
   - Click "Need Carpool"
   - Browse available carpools and send join requests

## Data Storage

Currently, the application uses **in-memory storage**, which means:
- ✅ No database setup required
- ✅ Quick to start
- ⚠️ Data is lost when the server restarts

To enable PostgreSQL (persistent storage):
1. Install PostgreSQL
2. Create a database
3. Run `database/schema.sql` to create tables
4. Set environment variables:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/carpool_db
   USE_DATABASE=true
   ```

## Stopping the Application

- **Frontend:** Press `Ctrl+C` in the frontend terminal
- **Backend:** Press `Ctrl+C` in the backend terminal

## Next Steps

- Read `QUICK_START.md` for feature testing
- Read `SYSTEM_DOCUMENTATION.md` for complete system details
- Configure email/SMS services for production use
- Set up PostgreSQL for data persistence

## Support

If you encounter issues:
1. Check the terminal output for error messages
2. Verify Node.js and npm are installed correctly
3. Ensure ports 3000 and 5000 are available
4. Check that both servers are running

