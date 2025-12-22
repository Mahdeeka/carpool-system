# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 14+ installed
- npm or yarn

### Step 1: Install & Run

```bash
# Clone or download the project
cd carpool-system

# Install frontend dependencies
npm install

# In a new terminal, install backend dependencies
cd backend
npm install

# Start backend server (from backend folder)
npm start
# Backend runs on http://localhost:5000

# Start frontend (from main folder)
cd ..
npm start
# Frontend runs on http://localhost:3000
```

### Step 2: Create Your First Event

1. Go to http://localhost:3000
2. Click "Admin Login"
3. Enter password: `admin123`
4. Fill in event details:
   - Event Name: "Test Event"
   - Event Date: Choose a date
   - Event Location: "Test Location"
5. Click "Create Event"
6. **Copy the generated event code** (e.g., "ABC12345")

### Step 3: Test as Driver

1. Open new incognito window
2. Go to http://localhost:3000
3. Enter the event code
4. Click "Offer Carpool"
5. Fill in your details:
   - Name: "John Driver"
   - Phone: "+1234567890"
   - Email: "john@example.com"
   - Seats: 3
   - Trip Type: Round Trip
   - Add pickup location
   - Choose "Public"
6. Submit and explore driver dashboard

### Step 4: Test as Passenger

1. Open another incognito window
2. Enter same event code
3. Click "Need Carpool"
4. Fill in details:
   - Name: "Jane Passenger"
   - Phone: "+9876543210"
   - Email: "jane@example.com"
   - Trip Type: Round Trip
   - Add desired location
5. Submit and browse available carpools
6. Send join request to the driver
7. Switch to driver window
8. Accept the request
9. Both can now see confirmed match!

### Step 5: Check Admin Dashboard

1. Go back to admin panel
2. Click "Admin Dashboard"
3. View statistics, drivers, passengers, and matches
4. Test "Send Reminders" button

## 📱 Test WhatsApp Integration

- Click any WhatsApp button
- It will open WhatsApp Web/App with pre-filled message
- Confirm phone numbers are formatted correctly

## 🎨 Customize

Edit `src/App.css` to change colors:
```css
/* Primary color */
.btn-primary { background-color: #YOUR_COLOR; }
```

## 🔒 Change Admin Password

In `src/pages/AdminLogin.js`, line 12:
```javascript
if (password === 'YOUR_NEW_PASSWORD') {
```

## 📧 Add Email Service (Next Step)

1. Sign up for SendGrid/Mailgun
2. Get API key
3. In `backend/server.js`, implement email sending
4. Use template from documentation

## 🚀 Deploy

### Frontend (Netlify)
```bash
npm run build
# Drag build folder to Netlify
```

### Backend (Heroku)
```bash
git init
heroku create your-app-name
git push heroku main
```

## ❓ Common Issues

**Port already in use:**
```bash
# Change port in backend/server.js:
const PORT = 5001;  // or any available port
```

**API not connecting:**
```bash
# Create .env file in root:
REACT_APP_API_URL=http://localhost:5000/api
```

## 📚 Next Steps

1. Read SYSTEM_DOCUMENTATION.md for complete details
2. Implement database (PostgreSQL recommended)
3. Add email service
4. Set up proper authentication
5. Deploy to production
6. Add SSL certificate

## 🆘 Need Help?

- Check SYSTEM_DOCUMENTATION.md
- Review backend/server.js for API details
- Inspect browser console for errors
- Check backend terminal for server logs

## ✅ Feature Checklist

- [x] Event creation
- [x] Driver registration
- [x] Passenger registration
- [x] Public carpools
- [x] Private carpools
- [x] Match system
- [x] WhatsApp integration
- [x] Admin dashboard
- [x] Responsive design
- [ ] Email notifications (needs implementation)
- [ ] Database persistence (currently in-memory)
- [ ] Production authentication

**Enjoy your carpool system! 🚗**
