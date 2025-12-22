# Carpool Management System

A comprehensive web-based carpool system for event organizers and attendees.

## Features

### For Event Organizers (Admin)
- Create and manage events with unique event codes
- View comprehensive statistics and analytics
- Monitor all drivers and passengers
- Track carpool matches and pending requests
- Send automated reminders
- Export data to CSV/Excel
- Manual matching suggestions

### For Drivers
- Create carpool offers (public or private)
- Manage pickup locations and times
- Accept/reject passenger requests
- Browse and invite passengers (for private carpools)
- View confirmed passengers
- WhatsApp integration for quick communication
- Calendar export functionality

### For Passengers
- Submit carpool requests
- Browse available public carpools
- Send join requests to drivers
- Receive and respond to driver invitations
- View confirmed carpool details
- WhatsApp integration

## Tech Stack

### Frontend
- React 19.2.1
- React Router DOM 7.10.1
- Modern CSS with responsive design
- Context API for state management

### Backend (To be implemented)
- Node.js + Express (recommended)
- PostgreSQL or MongoDB database
- Email service (SendGrid, AWS SES, or similar)
- RESTful API architecture

## Installation

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

The app will run on http://localhost:3000

### Environment Variables

Create a `.env` file in the root directory:

```
REACT_APP_API_URL=http://localhost:5000/api
```

## Backend Implementation Guide

The frontend is complete and ready. You need to implement the backend API with the following endpoints:

### Event APIs
- POST /api/validate-event-code
- POST /api/admin/event
- GET /api/admin/event/:eventId/stats

### Driver APIs
- POST /api/carpool/offer
- GET /api/carpool/offer/:offerId
- PUT /api/carpool/offer/:offerId
- DELETE /api/carpool/offer/:offerId
- GET /api/carpool/offer/:offerId/requests
- POST /api/carpool/offer/:offerId/accept-request
- POST /api/carpool/offer/:offerId/reject-request
- GET /api/carpool/passengers
- POST /api/carpool/offer/:offerId/send-invitation

### Passenger APIs
- POST /api/carpool/request
- GET /api/carpool/request/:requestId
- PUT /api/carpool/request/:requestId
- DELETE /api/carpool/request/:requestId
- GET /api/carpool/offers
- POST /api/carpool/request/:requestId/join-request
- GET /api/carpool/request/:requestId/invitations
- POST /api/carpool/request/:requestId/accept-invitation
- POST /api/carpool/request/:requestId/reject-invitation

### Match APIs
- GET /api/carpool/match/:matchId
- DELETE /api/carpool/match/:matchId

### Admin APIs
- GET /api/admin/event/:eventId/drivers
- GET /api/admin/event/:eventId/passengers
- GET /api/admin/event/:eventId/matches
- POST /api/admin/event/:eventId/suggest-match
- GET /api/admin/event/:eventId/export
- POST /api/admin/event/:eventId/broadcast
- POST /api/admin/event/:eventId/send-reminders

See the full API specification in the system documentation.

## Database Schema

### Tables Required:
1. events
2. users
3. carpool_offers
4. offer_locations
5. carpool_requests
6. request_locations
7. matches
8. notifications
9. admins

See the complete database schema in the system specification document.

## Email Templates

The system requires email notifications for:
- Join requests
- Invitations
- Acceptances/rejections
- 24-hour reminders
- Carpool cancellations

## Security Considerations

- Implement proper authentication for admin routes
- Use HTTPS in production
- Sanitize all inputs
- Use parameterized queries
- Implement rate limiting
- Validate event codes securely
- Hash admin passwords

## Deployment

### Frontend Deployment
- Build: `npm run build`
- Deploy build folder to any static hosting (Netlify, Vercel, AWS S3, etc.)

### Backend Deployment
- Deploy to Heroku, AWS, DigitalOcean, or similar
- Set up database (PostgreSQL on Heroku, AWS RDS, etc.)
- Configure environment variables
- Set up email service
- Enable CORS for frontend domain

## Features To Add (Future Enhancements)

- SMS notifications
- Push notifications
- In-app messaging
- Rating/review system
- Cost splitting calculator
- Map integration for routes
- Multi-language support
- Gender preference filters
- Recurring events
- Mobile apps (React Native)

## Admin Credentials (Development)

Default admin password: `admin123`

**Important:** Change this in production!

## Support

For issues or questions, please contact: [your-email@example.com]

## License

Proprietary - All rights reserved
