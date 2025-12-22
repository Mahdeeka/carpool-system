# Online Deployment Guide

Deploy your Carpool System for free using Render (backend) and Vercel (frontend).

## Prerequisites

1. **GitHub Account** - https://github.com (free)
2. **Render Account** - https://render.com (free)
3. **Vercel Account** - https://vercel.com (free)

---

## Step 1: Push Code to GitHub

### 1.1 Create a GitHub Repository

1. Go to https://github.com/new
2. Name it `carpool-system`
3. Keep it **Public** (required for free tier)
4. Click **Create repository**

### 1.2 Push Your Code

Open a terminal in the project folder and run:

```bash
cd carpool-system.tar/carpool-system

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Carpool System"

# Add your GitHub repository as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/carpool-system.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend on Render

### 2.1 Create Render Account

1. Go to https://render.com
2. Click **Get Started for Free**
3. Sign up with GitHub (easiest)

### 2.2 Create a New Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Select `carpool-system` repository

### 2.3 Configure the Service

| Setting | Value |
|---------|-------|
| **Name** | `carpool-backend` |
| **Region** | Choose closest to you |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

### 2.4 Add Environment Variables

Click **Advanced** → **Add Environment Variable**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | (leave empty for now, add after frontend deploy) |

### 2.5 Deploy

1. Click **Create Web Service**
2. Wait for deployment (2-5 minutes)
3. **Copy your backend URL** (e.g., `https://carpool-backend.onrender.com`)

> ⚠️ **Note:** Free Render services sleep after 15 minutes of inactivity. First request may take 30-60 seconds.

---

## Step 3: Deploy Frontend on Vercel

### 3.1 Create Vercel Account

1. Go to https://vercel.com
2. Click **Sign Up**
3. Sign up with GitHub (easiest)

### 3.2 Import Your Project

1. Click **Add New...** → **Project**
2. Select your `carpool-system` GitHub repository
3. Click **Import**

### 3.3 Configure the Project

| Setting | Value |
|---------|-------|
| **Project Name** | `carpool-app` |
| **Framework Preset** | Create React App |
| **Root Directory** | `.` (leave as is, or click Edit and select the frontend folder) |

### 3.4 Add Environment Variable

Click **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://YOUR-BACKEND-URL.onrender.com/api` |

Replace `YOUR-BACKEND-URL` with your actual Render backend URL from Step 2.5.

### 3.5 Deploy

1. Click **Deploy**
2. Wait for deployment (1-2 minutes)
3. **Copy your frontend URL** (e.g., `https://carpool-app.vercel.app`)

---

## Step 4: Connect Frontend and Backend

### 4.1 Update Backend CORS

Go back to **Render Dashboard**:

1. Click on your `carpool-backend` service
2. Go to **Environment** tab
3. Add/Update environment variable:
   - `FRONTEND_URL` = `https://your-app.vercel.app` (your Vercel URL)
4. Click **Save Changes**
5. The service will auto-redeploy

---

## Step 5: Test Your Deployment

1. Open your Vercel URL (e.g., `https://carpool-app.vercel.app`)
2. Test the following:
   - ✅ Home page loads
   - ✅ Login with phone number (OTP is `123456` in dev mode)
   - ✅ Create an event
   - ✅ Offer/Request carpools

---

## Updating Your App

### Making Changes

1. Edit files locally in Cursor
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your change description"
   git push
   ```
3. Both Vercel and Render will **auto-deploy** within minutes

### Viewing Logs

- **Render:** Dashboard → Your Service → Logs
- **Vercel:** Dashboard → Your Project → Deployments → Logs

---

## Troubleshooting

### "API not connecting"

1. Check backend is deployed and running on Render
2. Verify `REACT_APP_API_URL` in Vercel settings
3. Check browser console for CORS errors
4. Verify `FRONTEND_URL` in Render settings

### "Backend sleeping" (slow first load)

Free Render services sleep after 15 min of inactivity. Options:
- Wait 30-60 seconds for wake-up
- Upgrade to paid plan ($7/month) for always-on
- Use a service like UptimeRobot to ping your backend every 14 minutes

### "Data lost after deploy"

Currently using in-memory storage. To persist data:
1. Add a PostgreSQL database (Render offers free PostgreSQL)
2. Set `DATABASE_URL` and `USE_DATABASE=true` in Render environment

---

## Free Tier Limits

### Render (Backend)
- 750 hours/month (enough for one service 24/7)
- Auto-sleeps after 15 min inactivity
- Wakes on first request (30-60 sec delay)

### Vercel (Frontend)
- 100 GB bandwidth/month
- Unlimited deployments
- Auto-SSL included

---

## Optional: Add PostgreSQL Database

For data persistence (data survives restarts):

### On Render:

1. Dashboard → **New +** → **PostgreSQL**
2. Name: `carpool-db`
3. Instance Type: **Free**
4. Click **Create Database**
5. Copy the **Internal Database URL**
6. Add to backend environment:
   - `DATABASE_URL` = (paste the URL)
   - `USE_DATABASE` = `true`

---

## Your URLs

After deployment, update this section:

- **Frontend:** https://_________________.vercel.app
- **Backend:** https://_________________.onrender.com
- **API Health:** https://_________________.onrender.com/api/health

---

## Need Help?

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- React Deployment: https://create-react-app.dev/docs/deployment/

