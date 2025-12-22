# 🚗 My Rides - Data Persistence Guide

## Why is My Rides Empty?

The backend currently uses **in-memory storage**, which means:
- ✅ Fast and works without database setup
- ❌ **All data is lost when the server restarts**
- ❌ Data doesn't persist between sessions

## How to See Your Rides

### Option 1: Create New Rides (After Server Restart)
1. **Go to Events** - Navigate to home page
2. **Create or Join an Event** 
3. **Offer a Ride** - Click "Offer a Ride" and fill the form
4. **Or Request to Join** - Find a ride and click "Request to Join"
5. **Check My Rides** - Your rides will now appear!

### Option 2: Keep Server Running
- Don't restart the backend server
- Keep it running in the background
- Data will persist while server is up

### Option 3: Set Up PostgreSQL (Permanent Solution)
```bash
# Install PostgreSQL
# Create database
psql -U postgres
CREATE DATABASE carpool_db;

# Run schema
psql -U postgres -d carpool_db -f database/schema.sql

# Set environment variable
export DATABASE_URL="postgresql://postgres:password@localhost:5432/carpool_db"

# Restart server - will use PostgreSQL
```

## Current Data Status

**Backend Started:** Check terminal output for "🚀 Server running on port 5000"
**Storage Type:** "📦 Using in-memory storage"
**Data Persistence:** "💡 Data will be lost when server restarts"

## Quick Test

1. Open browser console (F12)
2. Go to "My Rides"  
3. Check console for debug logs:
   - `isAuthenticated: true/false`
   - `myOffers: 0 []`
   - `myJoinedRides: 0 []`
   - `myRequests: 0 []`

If all show `0`, the server was restarted and data was lost.

## Solution Summary

**Immediate:** Create new offers/requests to see the feature working
**Long-term:** Set up PostgreSQL for permanent data storage





