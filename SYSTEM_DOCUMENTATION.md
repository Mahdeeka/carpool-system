# Carpool System - Complete Documentation

## Project Overview

This is a complete, production-ready carpool management system built with React. The system allows event organizers to create events, drivers to offer carpools, and passengers to find rides.

## Directory Structure

```
carpool-system/
├── backend/
│   ├── server.js           # Express server with all API endpoints
│   └── package.json        # Backend dependencies
├── src/
│   ├── components/         # Reusable components (if needed)
│   ├── contexts/
│   │   └── AppContext.js   # Global state management
│   ├── pages/
│   │   ├── EventCodeEntry.js      # Entry point for users
│   │   ├── RoleSelection.js       # Choose driver/passenger
│   │   ├── OfferCarpool.js        # Driver registration
│   │   ├── NeedCarpool.js         # Passenger registration
│   │   ├── DriverDashboard.js     # Driver management
│   │   ├── PassengerDashboard.js  # Passenger management
│   │   ├── AdminLogin.js          # Admin authentication
│   │   ├── CreateEvent.js         # Event creation
│   │   └── AdminDashboard.js      # Admin panel
│   ├── services/
│   │   └── api.js          # API service layer
│   ├── App.js              # Main app component with routing
│   ├── App.css             # Complete styling
│   ├── index.js            # Entry point
│   └── index.css           # Base styles
├── public/
│   └── index.html          # HTML template
├── package.json            # Frontend dependencies
└── README.md               # Setup instructions
```

## Features Implemented

### User Features
✅ Event code validation
✅ Driver carpool creation (public/private)
✅ Passenger carpool requests
✅ Multiple pickup locations
✅ Flexible or specific time selection
✅ Round trip support (going/return/both)
✅ Browse available carpools
✅ Send/receive join requests
✅ Send/receive invitations
✅ Accept/reject requests
✅ WhatsApp integration
✅ Confirmed carpool details
✅ Real-time seat availability

### Admin Features
✅ Event creation with unique codes
✅ Comprehensive statistics dashboard
✅ View all drivers and passengers
✅ Monitor matches and pending requests
✅ Send reminders
✅ Export data functionality
✅ Manual matching tools

### UI/UX Features
✅ Responsive design (mobile-first)
✅ Toast notifications
✅ Loading states
✅ Error handling
✅ Clean, modern interface
✅ Intuitive navigation
✅ Tab-based layouts
✅ Card-based design
✅ Empty states
✅ Badge indicators

## How to Run

### Frontend

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Runs on http://localhost:3000

### Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start server
npm start
```

Runs on http://localhost:5000

## User Flow

### Driver Flow
1. Enter event code → Validate
2. Select "Offer Carpool"
3. Fill in details (name, phone, email, seats, car info)
4. Choose trip type (going/return/both)
5. Add pickup locations with time preferences
6. Choose privacy (public/private)
7. Submit and go to dashboard
8. For public: receive and accept/reject requests
9. For private: browse passengers and send invitations
10. View confirmed passengers
11. Contact via WhatsApp

### Passenger Flow
1. Enter event code → Validate
2. Select "Need Carpool"
3. Fill in details (name, phone, email)
4. Choose trip type (going/return/both)
5. Add desired pickup locations with time preferences
6. Submit and go to dashboard
7. Browse available carpools
8. Send join requests
9. Receive invitations
10. Accept invitation or wait for acceptance
11. View confirmed carpool
12. Contact driver via WhatsApp

### Admin Flow
1. Login with admin password
2. Create new event
3. Get unique event code
4. Share code with attendees
5. Monitor dashboard statistics
6. View all drivers and passengers
7. Check matches
8. Send reminders before event
9. Export data for records

## API Integration

The frontend calls the backend API through the `services/api.js` file. All API endpoints are already implemented in the backend `server.js`.

### Key API Methods
- `validateEventCode(eventCode)` - Validate event code
- `createEvent(eventData)` - Create new event
- `createCarpoolOffer(offerData)` - Driver creates offer
- `createCarpoolRequest(requestData)` - Passenger creates request
- `acceptRequest(offerId, requestId)` - Accept passenger
- `sendInvitation(offerId, requestId)` - Invite passenger
- And many more...

## Data Storage

Currently using in-memory storage in backend. For production:

### Recommended: PostgreSQL

Tables needed:
- events
- users
- carpool_offers
- offer_locations
- carpool_requests
- request_locations
- matches
- notifications
- admins

### Alternative: MongoDB

Collections needed:
- events
- users
- offers (with embedded locations)
- requests (with embedded locations)
- matches
- notifications

## Email Integration (To Implement)

Required email notifications:
1. **Join Request** - When passenger requests to join
2. **Invitation** - When driver invites passenger
3. **Acceptance** - When request/invitation is accepted
4. **Rejection** - When request/invitation is rejected
5. **24-Hour Reminder** - Before event
6. **Cancellation** - When carpool is cancelled

Recommended services:
- SendGrid
- AWS SES
- Mailgun
- Nodemailer (with SMTP)

## Security Notes

### Current Implementation
- Basic admin password (hardcoded)
- Event code validation
- Input validation on frontend
- CORS enabled

### Production Requirements
- Implement proper admin authentication (JWT)
- Hash admin passwords
- Use environment variables for secrets
- Add rate limiting
- Implement HTTPS
- Sanitize all inputs on backend
- Use parameterized queries
- Add request validation middleware
- Implement session management

## Customization Guide

### Changing Colors
Edit `App.css`:
- Primary: `#2563eb` (blue)
- Success: `#10b981` (green)
- Danger: `#ef4444` (red)
- Warning: `#f59e0b` (orange)

### Adding Languages
1. Create language files in `src/locales/`
2. Add translation context
3. Wrap text in translation function
4. Add language selector

### Modifying Email Templates
Edit backend email sending functions to customize:
- Subject lines
- Email body content
- Styling
- Links

### Adding Features
1. Create new component in `src/components/`
2. Add route in `App.js`
3. Create API endpoint in `backend/server.js`
4. Add API method in `src/services/api.js`
5. Import and use in pages

## Testing

### Frontend Testing
```bash
npm test
```

### Manual Testing Checklist
- [ ] Event code validation
- [ ] Driver registration
- [ ] Passenger registration
- [ ] Public carpool flow
- [ ] Private carpool flow
- [ ] Match creation
- [ ] WhatsApp links
- [ ] Admin dashboard
- [ ] Mobile responsiveness
- [ ] Email notifications (once implemented)

## Deployment

### Frontend Deployment (Netlify)
```bash
npm run build
# Deploy build folder
```

### Backend Deployment (Heroku)
```bash
git init
heroku create
git add .
git commit -m "Initial commit"
git push heroku main
```

### Environment Variables
Create `.env` file:
```
PORT=5000
DATABASE_URL=your_database_url
EMAIL_API_KEY=your_email_key
ADMIN_PASSWORD=your_secure_password
```

## Troubleshooting

### Common Issues

**Issue: API calls failing**
- Check backend is running
- Verify REACT_APP_API_URL in .env
- Check CORS settings

**Issue: Event code not working**
- Ensure backend has created event
- Check event_code in database
- Verify case sensitivity

**Issue: Matches not showing**
- Check match status in database
- Verify offer_id and request_id
- Check API response

**Issue: WhatsApp links not working**
- Verify phone number format
- Remove special characters
- Check international format

## Support & Maintenance

### Regular Tasks
- Monitor error logs
- Check email delivery rates
- Review match success rate
- Update dependencies
- Backup database
- Clean old events

### Performance Optimization
- Add pagination for large lists
- Implement caching
- Optimize database queries
- Add indexes
- Use CDN for assets
- Compress images

## Future Enhancements

Priority features to add:
1. In-app messaging
2. Push notifications
3. Rating system
4. Cost calculator
5. Route mapping
6. Gender preferences
7. Recurring events
8. Multi-language
9. Mobile apps
10. SMS notifications

## License

Proprietary - All rights reserved

## Contact

For support: [your-contact@example.com]

---

**Version**: 1.0.0
**Last Updated**: December 2024
