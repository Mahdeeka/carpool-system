const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Environment check
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory storage (for local development without PostgreSQL)
const db = {
  events: [],
  event_participants: [], // Users who joined an event
  users: [],
  accounts: [], // New: User accounts (phone, email, name)
  otp_codes: [], // New: OTP verification codes
  sessions: [], // New: User sessions/tokens
  carpool_offers: [],
  offer_locations: [],
  carpool_requests: [],
  request_locations: [],
  matches: []
};

// SMS Provider Configuration (Twilio or similar)
// For production, use actual SMS provider
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'mock'; // 'twilio' or 'mock'
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client if configured
let twilioClient = null;
if (SMS_PROVIDER === 'twilio' && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio SMS provider initialized');
  } catch (err) {
    console.log('⚠️ Twilio not available, using mock SMS');
  }
}

// Format phone number to E.164 format for Twilio
function formatPhoneNumber(phone) {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If starts with 0 (Israeli local format), convert to +972
  if (cleaned.startsWith('0')) {
    cleaned = '+972' + cleaned.substring(1);
  }
  
  // If doesn't start with +, assume it needs +972 (Israel)
  if (!cleaned.startsWith('+')) {
    // If starts with 972, add +
    if (cleaned.startsWith('972')) {
      cleaned = '+' + cleaned;
    } else {
      // Assume Israeli number
      cleaned = '+972' + cleaned;
    }
  }
  
  return cleaned;
}

// Send SMS function
async function sendSMS(phone, message) {
  // Format phone number to E.164 format
  const formattedPhone = formatPhoneNumber(phone);
  
  if (SMS_PROVIDER === 'twilio' && twilioClient) {
    try {
      await twilioClient.messages.create({
        body: message,
        from: TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });
      console.log(`📱 SMS sent to ${formattedPhone}`);
      return true;
    } catch (err) {
      console.error('SMS send error:', err.message);
      console.error('Phone was:', phone, '-> formatted:', formattedPhone);
      return false;
    }
  } else {
    // Mock SMS - log to console for development
    console.log(`📱 [MOCK SMS] To: ${formattedPhone}`);
    console.log(`   Message: ${message}`);
    return true;
  }
}

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Check if PostgreSQL is configured
let pool = null;
let useDatabase = false;

// For now, force in-memory storage since database schema needs updates
// Set USE_DATABASE=true in environment to enable database
if (process.env.DATABASE_URL && process.env.USE_DATABASE === 'true') {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });
  
  // Test database connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Database connection error:', err);
      console.log('📦 Falling back to in-memory storage');
      useDatabase = false;
    } else {
      console.log('✅ Database connected:', res.rows[0].now);
      useDatabase = true;
    }
  });
} else {
  console.log('📦 Using in-memory storage');
  console.log('💡 Data will be lost when server restarts');
}

// Middleware - CORS configuration
const corsOptions = {
  origin: isProduction ? process.env.FRONTEND_URL : (process.env.FRONTEND_URL || '*'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// =======================
// RATE LIMITING
// =======================

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: { message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for creating resources
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 creates per hour
  message: { message: 'Too many resources created, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all routes
app.use('/api/', generalLimiter);

// =======================
// STANDARDIZED ERROR HANDLING
// =======================

// Error response helper
function sendError(res, status, message, details = null) {
  const response = { success: false, message };
  if (details && !isProduction) {
    response.details = details;
  }
  return res.status(status).json(response);
}

// Success response helper
function sendSuccess(res, data = {}, message = 'Success') {
  return res.json({ success: true, message, ...data });
}

// Generate random event code
function generateEventCode() {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// Generate unique ID
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =======================
// EVENT APIS
// =======================

// Get event by code (for direct link access)
app.get('/api/event/:eventCode', async (req, res) => {
  try {
    const { eventCode } = req.params;
    const { access_code } = req.query;
    
    if (useDatabase && pool) {
      const result = await pool.query(
        'SELECT * FROM events WHERE event_code = $1 AND status = $2',
        [eventCode, 'active']
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ valid: false, message: 'Event not found' });
      }
      
      const event = result.rows[0];
      
      // Check if private event needs access code
      if (event.is_private && event.access_code && event.access_code !== access_code) {
        return res.json({ 
          valid: true, 
          needs_code: true,
          event_id: event.event_id,
          event_name: event.event_name
        });
      }
      
      res.json({
        valid: true,
        needs_code: false,
        event_id: event.event_id,
        event_name: event.event_name,
        event_date: event.event_date,
        event_time: event.event_time,
        event_location: event.event_location,
        location_lat: event.event_lat || event.location_lat || null,
        location_lng: event.event_lng || event.location_lng || null,
        is_private: event.is_private
      });
    } else {
      // In-memory storage
      const event = db.events.find(e => e.event_code === eventCode && e.status === 'active');
      
      if (!event) {
        return res.status(404).json({ valid: false, message: 'Event not found' });
      }
      
      // Check if private event needs access code
      if (event.is_private && event.access_code && event.access_code !== access_code) {
        return res.json({ 
          valid: true, 
          needs_code: true,
          event_id: event.event_id,
          event_name: event.event_name
        });
      }
      
      // Get participant count
      const participantCount = db.event_participants.filter(p => p.event_id === event.event_id).length;
      
      res.json({
        valid: true,
        needs_code: false,
        event_id: event.event_id,
        event_name: event.event_name,
        event_date: event.event_date,
        event_time: event.event_time,
        event_location: event.event_location,
        location_lat: event.event_lat || null,
        location_lng: event.event_lng || null,
        is_private: event.is_private,
        participant_count: participantCount
      });
    }
  } catch (error) {
    console.error('Error getting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join an event (authenticated user)
app.post('/api/event/:eventId/join', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const account = req.account;
    
    // Check if already joined
    const existingParticipant = db.event_participants.find(
      p => p.event_id === eventId && p.account_id === account.account_id
    );
    
    if (existingParticipant) {
      return res.json({ success: true, message: 'Already joined', already_joined: true });
    }
    
    // Add participant
    db.event_participants.push({
      id: generateId('participant'),
      event_id: eventId,
      account_id: account.account_id,
      name: account.name,
      phone: account.phone,
      email: account.email,
      joined_at: new Date(),
      accepted_terms: true
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event participants (for admin/owner)
app.get('/api/event/:eventId/participants', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const participants = db.event_participants.filter(p => p.event_id === eventId);
    
    res.json({ 
      success: true, 
      participants,
      count: participants.length
    });
  } catch (error) {
    console.error('Error getting event participants:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all offers for an event by event code
app.get('/api/event/:eventCode/offers', async (req, res) => {
  try {
    const { eventCode } = req.params;
    
    // First find the event
    const event = db.events.find(e => e.event_code === eventCode && e.status === 'active');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Ensure join_requests exists
    if (!db.join_requests) {
      db.join_requests = [];
    }
    
    // Get all offers for this event
    const eventOffers = db.carpool_offers.filter(o => o.event_id === event.event_id && o.status === 'active');
    
    const offers = eventOffers.map(offer => {
      const driver = db.users.find(u => u.user_id === offer.driver_id);
      const locations = db.offer_locations.filter(l => l.offer_id === offer.offer_id);
      
      // Get confirmed passengers from join_requests
      const confirmedPassengers = db.join_requests
        .filter(jr => jr.offer_id === offer.offer_id && jr.status === 'confirmed')
        .map(jr => ({ name: jr.name, phone: jr.phone, email: jr.email }));
      
      // Get pending request count
      const pendingRequests = db.join_requests
        .filter(jr => jr.offer_id === offer.offer_id && jr.status === 'pending')
        .length;
      
      return {
        ...offer,
        driver_name: offer.hide_name ? 'Hidden' : (offer.name || driver?.name || 'Driver'),
        driver_phone: offer.hide_phone ? 'Hidden' : (offer.phone || driver?.phone || ''),
        driver_email: offer.hide_email ? 'Hidden' : (offer.email || driver?.email),
        name: offer.hide_name ? 'Hidden' : (offer.name || driver?.name || 'Driver'),
        phone: offer.hide_phone ? 'Hidden' : (offer.phone || driver?.phone || ''),
        email: offer.hide_email ? 'Hidden' : (offer.email || driver?.email),
        locations,
        confirmed_passengers: confirmedPassengers,
        pending_requests: pendingRequests,
        hide_name: offer.hide_name || false,
        hide_phone: offer.hide_phone || false,
        hide_email: offer.hide_email || false,
        payment_required: offer.payment_required || 'not_required',
        payment_amount: offer.payment_amount || null,
        payment_method: offer.payment_method || null
      };
    });

    res.json({ offers });
  } catch (error) {
    console.error('Error getting event offers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all requests for an event by event code
app.get('/api/event/:eventCode/requests', async (req, res) => {
  try {
    const { eventCode } = req.params;
    
    // First find the event
    const event = db.events.find(e => e.event_code === eventCode && e.status === 'active');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get all requests for this event
    const eventRequests = db.carpool_requests.filter(r => r.event_id === event.event_id && r.status === 'active');
    
    const requests = eventRequests.map(request => {
      const passenger = db.users.find(u => u.user_id === request.passenger_id);
      const locations = db.request_locations.filter(l => l.request_id === request.request_id);
      
      // Check if this request has a confirmed match
      const confirmedMatch = db.matches.find(m => m.request_id === request.request_id && m.status === 'confirmed');
      let matchedOffer = null;
      if (confirmedMatch) {
        const offer = db.carpool_offers.find(o => o.offer_id === confirmedMatch.offer_id);
        const driver = db.users.find(u => u.user_id === offer?.driver_id);
        matchedOffer = {
          offer_id: offer?.offer_id,
          driver_name: driver?.name,
          driver_phone: driver?.phone,
          description: offer?.description
        };
      }
      
      return {
        ...request,
        name: passenger?.name,
        phone: passenger?.phone,
        email: passenger?.email,
        locations,
        matched_offer: matchedOffer
      };
    });
    
    res.json({ requests });
  } catch (error) {
    console.error('Error getting event requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/validate-event-code', async (req, res) => {
  try {
    const { event_code, access_code } = req.body;
    
    if (useDatabase && pool) {
      const result = await pool.query(
        'SELECT * FROM events WHERE event_code = $1 AND status = $2',
        [event_code, 'active']
      );
      
      if (result.rows.length > 0) {
        const event = result.rows[0];
        
        // Check access code for private events
        if (event.is_private && event.access_code && event.access_code !== access_code) {
          return res.status(403).json({ valid: false, message: 'Invalid access code' });
        }
        
        res.json({
          valid: true,
          event_id: event.event_id,
          event_name: event.event_name,
          event_date: event.event_date,
          event_time: event.event_time,
          event_location: event.event_location,
          is_private: event.is_private
        });
      } else {
        res.status(404).json({ valid: false, message: 'Invalid event code' });
      }
    } else {
      // In-memory storage
      const event = db.events.find(e => e.event_code === event_code && e.status === 'active');
      if (event) {
        // Check access code for private events
        if (event.is_private && event.access_code && event.access_code !== access_code) {
          return res.status(403).json({ valid: false, message: 'Invalid access code' });
        }
        
        res.json({
          valid: true,
          event_id: event.event_id,
          event_name: event.event_name,
          event_date: event.event_date,
          event_time: event.event_time,
          event_location: event.event_location,
          is_private: event.is_private
        });
      } else {
        res.status(404).json({ valid: false, message: 'Invalid event code' });
      }
    }
  } catch (error) {
    console.error('Error validating event code:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event - requires authentication
app.post('/api/event', async (req, res) => {
  try {
    const { eventName, eventDate, eventTime, eventLocation, eventLat, eventLng, isPrivate, accessCode } = req.body;
    const eventCode = generateEventCode();
    const eventId = generateId('event');
    
    // Check for authentication token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let account = null;
    
    console.log('=== CREATE EVENT ===');
    console.log('Auth header present:', !!authHeader);
    console.log('Token extracted:', token ? token.substring(0, 10) + '...' : 'none');
    
    if (token) {
      const session = db.sessions.find(s => s.token === token && s.expires_at > new Date());
      console.log('Session found:', !!session);
      if (session) {
        account = db.accounts.find(a => a.account_id === session.account_id);
        console.log('Account found:', account ? account.name : 'none');
      } else {
        console.log('Active sessions:', db.sessions.map(s => ({ 
          token_prefix: s.token.substring(0, 10), 
          expires: s.expires_at,
          is_valid: s.expires_at > new Date()
        })));
      }
    }
    
    // Require authentication for event creation
    if (!account) {
      console.log('No valid account - rejecting event creation');
      return res.status(401).json({ message: 'Authentication required to create events. Please login first.' });
    }
    
    console.log('Creating event for account:', account.account_id, account.name);
    
    // Generate shareable link
    const shareableLink = `/event/${eventCode}`;
    
    if (useDatabase && pool) {
      await pool.query(
        'INSERT INTO events (event_id, event_name, event_date, event_time, event_location, event_code, is_private, access_code, creator_account_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [eventId, eventName, eventDate, eventTime, eventLocation, eventCode, isPrivate || false, isPrivate ? accessCode : null, account.account_id]
      );
    } else {
      // In-memory storage
      db.events.push({
        event_id: eventId,
        event_name: eventName,
        event_date: eventDate,
        event_time: eventTime,
        event_location: eventLocation,
        event_lat: eventLat || null,
        event_lng: eventLng || null,
        event_code: eventCode,
        is_private: isPrivate || false,
        access_code: isPrivate ? accessCode : null,
        creator_account_id: account.account_id,
        creator_name: account.name,
        creator_phone: account.phone,
        status: 'active',
        created_at: new Date()
      });
      
      console.log('Event created:', { eventId, eventCode, creator: account.account_id });
      console.log('Total events now:', db.events.length);
    }
    
    res.json({ 
      event_id: eventId, 
      event_code: eventCode, 
      shareable_link: shareableLink,
      success: true 
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Legacy admin endpoint (kept for backward compatibility)
app.post('/api/admin/event', authenticateToken, createLimiter, async (req, res) => {
  try {
    const { eventName, eventDate, eventLocation } = req.body;
    const eventCode = generateEventCode();
    const eventId = generateId('event');
    
    if (useDatabase && pool) {
      await pool.query(
        'INSERT INTO events (event_id, event_name, event_date, event_location, event_code) VALUES ($1, $2, $3, $4, $5)',
        [eventId, eventName, eventDate, eventLocation, eventCode]
      );
    } else {
      // In-memory storage
      db.events.push({
        event_id: eventId,
        event_name: eventName,
        event_date: eventDate,
        event_location: eventLocation,
        event_code: eventCode,
        is_private: false,
        status: 'active',
        created_at: new Date()
      });
    }
    
    res.json({ event_id: eventId, event_code: eventCode, success: true });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/event/:eventId/stats', authenticateToken, requireEventAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (useDatabase && pool) {
      const driversResult = await pool.query(
        'SELECT COUNT(*) FROM carpool_offers WHERE event_id = $1',
        [eventId]
      );
      
      const passengersResult = await pool.query(
        'SELECT COUNT(*) FROM carpool_requests WHERE event_id = $1',
        [eventId]
      );
      
      const seatsResult = await pool.query(
        'SELECT COALESCE(SUM(available_seats), 0) as available, COALESCE(SUM(total_seats), 0) as total FROM carpool_offers WHERE event_id = $1 AND status = $2',
        [eventId, 'active']
      );
      
      const matchesResult = await pool.query(
        'SELECT COUNT(*) FROM matches m JOIN carpool_offers o ON m.offer_id = o.offer_id WHERE o.event_id = $1 AND m.status = $2',
        [eventId, 'confirmed']
      );
      
      const pendingResult = await pool.query(
        'SELECT COUNT(*) FROM matches m JOIN carpool_offers o ON m.offer_id = o.offer_id WHERE o.event_id = $1 AND m.status = $2',
        [eventId, 'pending']
      );
      
      res.json({
        total_drivers: parseInt(driversResult.rows[0].count),
        total_passengers: parseInt(passengersResult.rows[0].count),
        available_seats: parseInt(seatsResult.rows[0].available || 0),
        total_seats: parseInt(seatsResult.rows[0].total || 0),
        confirmed_matches: parseInt(matchesResult.rows[0].count),
        pending_requests: parseInt(pendingResult.rows[0].count),
        unmatched_passengers: parseInt(passengersResult.rows[0].count) - parseInt(matchesResult.rows[0].count)
      });
    } else {
      // In-memory storage
      const offers = db.carpool_offers.filter(o => o.event_id === eventId);
      const requests = db.carpool_requests.filter(r => r.event_id === eventId);
      const activeOffers = offers.filter(o => o.status === 'active');
      const offerIds = offers.map(o => o.offer_id);
      const confirmedMatches = db.matches.filter(m => offerIds.includes(m.offer_id) && m.status === 'confirmed');
      const pendingMatches = db.matches.filter(m => offerIds.includes(m.offer_id) && m.status === 'pending');
      
      res.json({
        total_drivers: offers.length,
        total_passengers: requests.length,
        available_seats: activeOffers.reduce((sum, o) => sum + o.available_seats, 0),
        total_seats: activeOffers.reduce((sum, o) => sum + o.total_seats, 0),
        confirmed_matches: confirmedMatches.length,
        pending_requests: pendingMatches.length,
        unmatched_passengers: requests.length - confirmedMatches.length
      });
    }
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// DRIVER APIS
// =======================

// Create offer - supports both authenticated and anonymous (legacy) modes
app.post('/api/carpool/offer', async (req, res) => {
  try {
    const { event_id, name, phone, email, total_seats, description, trip_type, privacy, preference, locations, gender, hide_name, hide_phone, hide_email, payment_required, payment_amount, payment_method } = req.body;
    const offerId = generateId('offer');
    const userId = generateId('user');
    
    // Check for authentication token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let account = null;
    
    if (token) {
      const session = db.sessions.find(s => s.token === token && s.expires_at > new Date());
      if (session) {
        account = db.accounts.find(a => a.account_id === session.account_id);
      }
    }
    
    if (useDatabase && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Insert user
        await client.query(
          'INSERT INTO users (user_id, event_id, name, phone, email, role) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, event_id, account?.name || name, account?.phone || phone, account?.email || email, 'driver']
        );
        
        // Insert offer
        await client.query(
          'INSERT INTO carpool_offers (offer_id, driver_id, event_id, total_seats, available_seats, description, trip_type, privacy) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [offerId, userId, event_id, total_seats, total_seats, description, trip_type, privacy]
        );
        
        // Insert locations
        for (let i = 0; i < locations.length; i++) {
          const loc = locations[i];
          await client.query(
            'INSERT INTO offer_locations (offer_id, location_address, trip_direction, time_type, specific_time, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
            [offerId, loc.location_address, loc.trip_direction, loc.time_type, loc.specific_time, i]
          );
        }
        
        await client.query('COMMIT');
        res.json({ offer_id: offerId, user_id: userId, success: true });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // In-memory storage
      db.users.push({
        user_id: userId,
        event_id,
        name: account?.name || name,
        phone: account?.phone || phone,
        email: account?.email || email,
        role: 'driver',
        created_at: new Date()
      });
      
      db.carpool_offers.push({
        offer_id: offerId,
        driver_id: userId,
        account_id: account?.account_id || null, // Link to account if authenticated
        event_id,
        name: name, // Store the actual name
        phone: phone, // Store the actual phone
        email: email, // Store the email
        total_seats,
        available_seats: total_seats,
        description,
        trip_type,
        privacy,
        preference: preference || 'any',
        gender: gender || account?.gender || null,
        hide_name: hide_name || false,
        hide_phone: hide_phone || false,
        hide_email: hide_email || false,
        payment_required: payment_required || 'not_required',
        payment_amount: payment_amount || null,
        payment_method: payment_method || null,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      locations.forEach((loc, i) => {
        db.offer_locations.push({
          location_id: db.offer_locations.length + 1,
          offer_id: offerId,
          location_address: loc.location_address,
          trip_direction: loc.trip_direction,
          time_type: loc.time_type,
          specific_time: loc.specific_time,
          sort_order: i
        });
      });
      
      res.json({ offer_id: offerId, user_id: userId, success: true });
    }
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/carpool/offer/:offerId', async (req, res) => {
  try {
    const { offerId } = req.params;
    
    if (useDatabase && pool) {
      const offerResult = await pool.query(
        'SELECT * FROM carpool_offers WHERE offer_id = $1',
        [offerId]
      );
      
      if (offerResult.rows.length === 0) {
        return res.status(404).json({ message: 'Offer not found' });
      }
      
      const locationsResult = await pool.query(
        'SELECT * FROM offer_locations WHERE offer_id = $1 ORDER BY sort_order',
        [offerId]
      );
      
      const matchesResult = await pool.query(
        `SELECT m.*, u.name as passenger_name, u.phone as passenger_phone, u.email as passenger_email
         FROM matches m
         JOIN users u ON m.passenger_id = u.user_id
         WHERE m.offer_id = $1 AND m.status = $2`,
        [offerId, 'confirmed']
      );
      
      const offer = offerResult.rows[0];
      offer.locations = locationsResult.rows;
      offer.matches = matchesResult.rows;
      
      res.json(offer);
    } else {
      // In-memory storage
      const offer = db.carpool_offers.find(o => o.offer_id === offerId);
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }
      
      const locations = db.offer_locations.filter(l => l.offer_id === offerId).sort((a, b) => a.sort_order - b.sort_order);
      const matches = db.matches.filter(m => m.offer_id === offerId && m.status === 'confirmed').map(m => {
        const passenger = db.users.find(u => u.user_id === m.passenger_id);
        return {
          ...m,
          passenger_name: passenger?.name,
          passenger_phone: passenger?.phone,
          passenger_email: passenger?.email
        };
      });
      
      res.json({ ...offer, locations, matches });
    }
  } catch (error) {
    console.error('Error getting offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/carpool/offer/:offerId/requests', async (req, res) => {
  try {
    const { offerId } = req.params;
    
    if (useDatabase && pool) {
      const requestsResult = await pool.query(
        `SELECT m.*, u.name as passenger_name, u.phone as passenger_phone, u.email as passenger_email, 
                r.trip_type, rl.location_address as location
         FROM matches m
         JOIN carpool_requests r ON m.request_id = r.request_id
         JOIN users u ON r.passenger_id = u.user_id
         LEFT JOIN request_locations rl ON r.request_id = rl.request_id
         WHERE m.offer_id = $1
         ORDER BY m.created_at DESC`,
        [offerId]
      );
      
      res.json({ requests: requestsResult.rows });
    } else {
      // In-memory storage
      const matches = db.matches.filter(m => m.offer_id === offerId);
      const requests = matches.map(m => {
        const request = db.carpool_requests.find(r => r.request_id === m.request_id);
        const passenger = db.users.find(u => u.user_id === request?.passenger_id);
        const location = db.request_locations.find(l => l.request_id === m.request_id);
        return {
          ...m,
          passenger_name: passenger?.name,
          passenger_phone: passenger?.phone,
          passenger_email: passenger?.email,
          trip_type: request?.trip_type,
          location: location?.location_address
        };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      res.json({ requests });
    }
  } catch (error) {
    console.error('Error getting requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/carpool/offer/:offerId/accept-request', authenticateToken, async (req, res) => {
  try {
    const { offerId } = req.params;
    const { request_id } = req.body;

    // Verify ownership
    if (!isOfferOwner(req.account, offerId)) {
      return res.status(403).json({ message: 'Not authorized to manage this offer' });
    }

    // Check if seats are available before accepting
    const offer = db.carpool_offers.find(o => o.offer_id === offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.available_seats <= 0) {
      return res.status(400).json({ message: 'No seats available' });
    }

    if (useDatabase && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await client.query(
          'UPDATE matches SET status = $1, confirmed_at = NOW() WHERE offer_id = $2 AND request_id = $3',
          ['confirmed', offerId, request_id]
        );

        await client.query(
          'UPDATE carpool_offers SET available_seats = GREATEST(available_seats - 1, 0) WHERE offer_id = $1',
          [offerId]
        );

        await client.query('COMMIT');
        res.json({ success: true });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // In-memory storage
      const match = db.matches.find(m => m.offer_id === offerId && m.request_id === request_id);
      if (match) {
        match.status = 'confirmed';
        match.confirmed_at = new Date();
      }
      // Safe decrement - never go below 0
      if (offer.available_seats > 0) {
        offer.available_seats -= 1;
      }
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/carpool/offer/:offerId/reject-request', authenticateToken, async (req, res) => {
  try {
    const { offerId } = req.params;
    const { request_id } = req.body;

    // Verify ownership
    if (!isOfferOwner(req.account, offerId)) {
      return res.status(403).json({ message: 'Not authorized to manage this offer' });
    }

    if (useDatabase && pool) {
      await pool.query(
        'UPDATE matches SET status = $1 WHERE offer_id = $2 AND request_id = $3',
        ['rejected', offerId, request_id]
      );
    } else {
      // In-memory storage
      const match = db.matches.find(m => m.offer_id === offerId && m.request_id === request_id);
      if (match) {
        match.status = 'rejected';
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/carpool/passengers', async (req, res) => {
  try {
    const { event_id } = req.query;
    
    if (useDatabase && pool) {
      const passengersResult = await pool.query(
        `SELECT r.*, u.name, u.phone, u.email,
                json_agg(json_build_object('location_address', rl.location_address, 'trip_direction', rl.trip_direction)) as locations
         FROM carpool_requests r
         JOIN users u ON r.passenger_id = u.user_id
         LEFT JOIN request_locations rl ON r.request_id = rl.request_id
         WHERE r.event_id = $1
         GROUP BY r.request_id, u.user_id`,
        [event_id]
      );
      
      res.json({ passengers: passengersResult.rows });
    } else {
      // In-memory storage
      const requests = db.carpool_requests.filter(r => r.event_id === event_id);
      const passengers = requests.map(r => {
        const user = db.users.find(u => u.user_id === r.passenger_id);
        const locations = db.request_locations.filter(l => l.request_id === r.request_id).map(l => ({
          location_address: l.location_address,
          trip_direction: l.trip_direction
        }));
        return { ...r, name: user?.name, phone: user?.phone, email: user?.email, locations };
      });
      
      res.json({ passengers });
    }
  } catch (error) {
    console.error('Error getting passengers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/carpool/offer/:offerId/send-invitation', authenticateToken, async (req, res) => {
  try {
    const { offerId } = req.params;
    const { request_id } = req.body;
    const matchId = generateId('match');

    // Verify ownership
    if (!isOfferOwner(req.account, offerId)) {
      return res.status(403).json({ message: 'Not authorized to manage this offer' });
    }

    if (useDatabase && pool) {
      // Get driver and passenger IDs
      const offerResult = await pool.query('SELECT driver_id FROM carpool_offers WHERE offer_id = $1', [offerId]);
      const requestResult = await pool.query('SELECT passenger_id FROM carpool_requests WHERE request_id = $1', [request_id]);
      
      await pool.query(
        'INSERT INTO matches (match_id, offer_id, request_id, driver_id, passenger_id, status, initiated_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [matchId, offerId, request_id, offerResult.rows[0].driver_id, requestResult.rows[0].passenger_id, 'pending', 'driver']
      );
    } else {
      // In-memory storage
      const offer = db.carpool_offers.find(o => o.offer_id === offerId);
      const request = db.carpool_requests.find(r => r.request_id === request_id);
      
      db.matches.push({
        match_id: matchId,
        offer_id: offerId,
        request_id,
        driver_id: offer?.driver_id,
        passenger_id: request?.passenger_id,
        status: 'pending',
        initiated_by: 'driver',
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    res.json({ success: true, notification_id: matchId });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// PASSENGER APIS
// =======================

// Create request - supports both authenticated and anonymous (legacy) modes
app.post('/api/carpool/request', async (req, res) => {
  try {
    const { event_id, name, phone, email, trip_type, preference, locations, gender, hide_name, hide_phone, hide_email, passenger_count } = req.body;
    const requestId = generateId('request');
    const userId = generateId('user');
    
    // Check for authentication token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let account = null;
    
    if (token) {
      const session = db.sessions.find(s => s.token === token && s.expires_at > new Date());
      if (session) {
        account = db.accounts.find(a => a.account_id === session.account_id);
      }
    }
    
    if (useDatabase && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Insert user
        await client.query(
          'INSERT INTO users (user_id, event_id, name, phone, email, role) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, event_id, account?.name || name, account?.phone || phone, account?.email || email, 'passenger']
        );
        
        // Insert request
        await client.query(
          'INSERT INTO carpool_requests (request_id, passenger_id, event_id, trip_type) VALUES ($1, $2, $3, $4)',
          [requestId, userId, event_id, trip_type]
        );
        
        // Insert locations
        for (let i = 0; i < locations.length; i++) {
          const loc = locations[i];
          await client.query(
            'INSERT INTO request_locations (request_id, location_address, trip_direction, time_type, specific_time, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
            [requestId, loc.location_address, loc.trip_direction, loc.time_type, loc.specific_time, i]
          );
        }
        
        await client.query('COMMIT');
        res.json({ request_id: requestId, user_id: userId, success: true });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // In-memory storage
      db.users.push({
        user_id: userId,
        event_id,
        name: account?.name || name,
        phone: account?.phone || phone,
        email: account?.email || email,
        role: 'passenger',
        created_at: new Date()
      });
      
      db.carpool_requests.push({
        request_id: requestId,
        passenger_id: userId,
        account_id: account?.account_id || null, // Link to account if authenticated
        event_id,
        name: name, // Store the actual name
        phone: phone, // Store the actual phone
        email: email, // Store the email
        trip_type,
        preference: preference || 'any',
        gender: gender || account?.gender || null,
        hide_name: hide_name || false,
        hide_phone: hide_phone || false,
        hide_email: hide_email || false,
        passenger_count: passenger_count || 1,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      locations.forEach((loc, i) => {
        db.request_locations.push({
          location_id: db.request_locations.length + 1,
          request_id: requestId,
          location_address: loc.location_address,
          trip_direction: loc.trip_direction,
          time_type: loc.time_type,
          specific_time: loc.specific_time,
          sort_order: i
        });
      });
      
      res.json({ request_id: requestId, user_id: userId, success: true });
    }
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/carpool/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (useDatabase && pool) {
      const requestResult = await pool.query(
        'SELECT * FROM carpool_requests WHERE request_id = $1',
        [requestId]
      );
      
      if (requestResult.rows.length === 0) {
        return res.status(404).json({ message: 'Request not found' });
      }
      
      const locationsResult = await pool.query(
        'SELECT * FROM request_locations WHERE request_id = $1 ORDER BY sort_order',
        [requestId]
      );
      
      const matchResult = await pool.query(
        `SELECT m.*, u.name as driver_name, u.phone as driver_phone, u.email as driver_email,
                o.description as car_description
         FROM matches m
         JOIN carpool_offers o ON m.offer_id = o.offer_id
         JOIN users u ON o.driver_id = u.user_id
         WHERE m.request_id = $1 AND m.status = $2
         LIMIT 1`,
        [requestId, 'confirmed']
      );
      
      const request = requestResult.rows[0];
      request.locations = locationsResult.rows;
      request.match = matchResult.rows.length > 0 ? matchResult.rows[0] : null;
      
      res.json(request);
    } else {
      // In-memory storage
      const request = db.carpool_requests.find(r => r.request_id === requestId);
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
      
      const locations = db.request_locations.filter(l => l.request_id === requestId).sort((a, b) => a.sort_order - b.sort_order);
      const matchData = db.matches.find(m => m.request_id === requestId && m.status === 'confirmed');
      let match = null;
      if (matchData) {
        const offer = db.carpool_offers.find(o => o.offer_id === matchData.offer_id);
        const driver = db.users.find(u => u.user_id === offer?.driver_id);
        match = {
          ...matchData,
          driver_name: driver?.name,
          driver_phone: driver?.phone,
          driver_email: driver?.email,
          car_description: offer?.description
        };
      }
      
      res.json({ ...request, locations, match });
    }
  } catch (error) {
    console.error('Error getting request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/carpool/offers', async (req, res) => {
  try {
    const { event_id } = req.query;
    
    if (useDatabase && pool) {
      const offersResult = await pool.query(
        `SELECT o.*, u.name as driver_name, u.phone as driver_phone, u.email as driver_email,
                json_agg(json_build_object('location_address', ol.location_address, 'trip_direction', ol.trip_direction)) as locations
         FROM carpool_offers o
         JOIN users u ON o.driver_id = u.user_id
         LEFT JOIN offer_locations ol ON o.offer_id = ol.offer_id
         WHERE o.event_id = $1 AND o.privacy = $2 AND o.status = $3
         GROUP BY o.offer_id, u.user_id`,
        [event_id, 'public', 'active']
      );
      
      res.json({ offers: offersResult.rows });
    } else {
      // In-memory storage
      const offers = db.carpool_offers.filter(o => o.event_id === event_id && o.privacy === 'public' && o.status === 'active');
      const result = offers.map(o => {
        const driver = db.users.find(u => u.user_id === o.driver_id);
        const locations = db.offer_locations.filter(l => l.offer_id === o.offer_id).map(l => ({
          location_address: l.location_address,
          trip_direction: l.trip_direction
        }));
        return {
          ...o,
          driver_name: o.hide_name ? 'Hidden' : (o.name || driver?.name || 'Driver'),
          driver_phone: o.hide_phone ? 'Hidden' : (o.phone || driver?.phone || ''),
          driver_email: o.hide_email ? 'Hidden' : (o.email || driver?.email),
          locations,
          hide_name: o.hide_name || false,
          hide_phone: o.hide_phone || false,
          hide_email: o.hide_email || false,
          payment_required: o.payment_required || 'not_required',
          payment_amount: o.payment_amount || null,
          payment_method: o.payment_method || null
        };
      });
      
      res.json({ offers: result });
    }
  } catch (error) {
    console.error('Error getting offers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/carpool/request/:requestId/join-request', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { offer_id } = req.body;
    const matchId = generateId('match');
    
    if (useDatabase && pool) {
      // Get driver and passenger IDs
      const offerResult = await pool.query('SELECT driver_id FROM carpool_offers WHERE offer_id = $1', [offer_id]);
      const requestResult = await pool.query('SELECT passenger_id FROM carpool_requests WHERE request_id = $1', [requestId]);
      
      await pool.query(
        'INSERT INTO matches (match_id, offer_id, request_id, driver_id, passenger_id, status, initiated_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [matchId, offer_id, requestId, offerResult.rows[0].driver_id, requestResult.rows[0].passenger_id, 'pending', 'passenger']
      );
    } else {
      // In-memory storage
      const offer = db.carpool_offers.find(o => o.offer_id === offer_id);
      const request = db.carpool_requests.find(r => r.request_id === requestId);
      
      db.matches.push({
        match_id: matchId,
        offer_id,
        request_id: requestId,
        driver_id: offer?.driver_id,
        passenger_id: request?.passenger_id,
        status: 'pending',
        initiated_by: 'passenger',
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    res.json({ success: true, notification_id: matchId });
  } catch (error) {
    console.error('Error sending join request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/carpool/request/:requestId/invitations', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (useDatabase && pool) {
      const invitationsResult = await pool.query(
        `SELECT m.*, u.name as driver_name, u.phone as driver_phone, u.email as driver_email,
                o.description as car_description, ol.location_address as location
         FROM matches m
         JOIN carpool_offers o ON m.offer_id = o.offer_id
         JOIN users u ON o.driver_id = u.user_id
         LEFT JOIN offer_locations ol ON o.offer_id = ol.offer_id
         WHERE m.request_id = $1 AND m.initiated_by = $2
         ORDER BY m.created_at DESC`,
        [requestId, 'driver']
      );
      
      res.json({ invitations: invitationsResult.rows });
    } else {
      // In-memory storage
      const matches = db.matches.filter(m => m.request_id === requestId && m.initiated_by === 'driver');
      const invitations = matches.map(m => {
        const offer = db.carpool_offers.find(o => o.offer_id === m.offer_id);
        const driver = db.users.find(u => u.user_id === offer?.driver_id);
        const location = db.offer_locations.find(l => l.offer_id === m.offer_id);
        return {
          ...m,
          driver_name: driver?.name,
          driver_phone: driver?.phone,
          driver_email: driver?.email,
          car_description: offer?.description,
          location: location?.location_address
        };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      res.json({ invitations });
    }
  } catch (error) {
    console.error('Error getting invitations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/carpool/request/:requestId/accept-invitation', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { match_id } = req.body;
    
    if (useDatabase && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        await client.query(
          'UPDATE matches SET status = $1, confirmed_at = NOW() WHERE match_id = $2',
          ['confirmed', match_id]
        );
        
        // Get offer_id from match
        const matchResult = await client.query('SELECT offer_id FROM matches WHERE match_id = $1', [match_id]);
        
        await client.query(
          'UPDATE carpool_offers SET available_seats = available_seats - 1 WHERE offer_id = $1',
          [matchResult.rows[0].offer_id]
        );
        
        await client.query('COMMIT');
        res.json({ success: true });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // In-memory storage
      const match = db.matches.find(m => m.match_id === match_id);
      if (match) {
        match.status = 'confirmed';
        match.confirmed_at = new Date();
        const offer = db.carpool_offers.find(o => o.offer_id === match.offer_id);
        if (offer) {
          offer.available_seats -= 1;
        }
      }
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/carpool/request/:requestId/reject-invitation', async (req, res) => {
  try {
    const { match_id } = req.body;
    
    if (useDatabase && pool) {
      await pool.query(
        'UPDATE matches SET status = $1 WHERE match_id = $2',
        ['rejected', match_id]
      );
    } else {
      // In-memory storage
      const match = db.matches.find(m => m.match_id === match_id);
      if (match) {
        match.status = 'rejected';
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// ADMIN APIS
// =======================

app.get('/api/admin/event/:eventId/drivers', authenticateToken, requireEventAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (useDatabase && pool) {
      const driversResult = await pool.query(
        `SELECT o.*, u.name, u.phone, u.email
         FROM carpool_offers o
         JOIN users u ON o.driver_id = u.user_id
         WHERE o.event_id = $1
         ORDER BY o.created_at DESC`,
        [eventId]
      );
      
      res.json({ drivers: driversResult.rows });
    } else {
      // In-memory storage
      const offers = db.carpool_offers.filter(o => o.event_id === eventId);
      const drivers = offers.map(o => {
        const user = db.users.find(u => u.user_id === o.driver_id);
        return { ...o, name: user?.name, phone: user?.phone, email: user?.email };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      res.json({ drivers });
    }
  } catch (error) {
    console.error('Error getting drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/event/:eventId/passengers', authenticateToken, requireEventAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (useDatabase && pool) {
      const passengersResult = await pool.query(
        `SELECT r.*, u.name, u.phone, u.email,
                CASE WHEN EXISTS (SELECT 1 FROM matches WHERE request_id = r.request_id AND status = 'confirmed') 
                     THEN true ELSE false END as matched
         FROM carpool_requests r
         JOIN users u ON r.passenger_id = u.user_id
         WHERE r.event_id = $1
         ORDER BY r.created_at DESC`,
        [eventId]
      );
      
      res.json({ passengers: passengersResult.rows });
    } else {
      // In-memory storage
      const requests = db.carpool_requests.filter(r => r.event_id === eventId);
      const passengers = requests.map(r => {
        const user = db.users.find(u => u.user_id === r.passenger_id);
        const matched = db.matches.some(m => m.request_id === r.request_id && m.status === 'confirmed');
        return { ...r, name: user?.name, phone: user?.phone, email: user?.email, matched };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      res.json({ passengers });
    }
  } catch (error) {
    console.error('Error getting passengers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/event/:eventId/matches', authenticateToken, requireEventAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (useDatabase && pool) {
      const matchesResult = await pool.query(
        `SELECT m.*, 
                du.name as driver_name, du.phone as driver_phone,
                pu.name as passenger_name, pu.phone as passenger_phone,
                rl.location_address as pickup_location
         FROM matches m
         JOIN carpool_offers o ON m.offer_id = o.offer_id
         JOIN users du ON m.driver_id = du.user_id
         JOIN users pu ON m.passenger_id = pu.user_id
         LEFT JOIN request_locations rl ON m.request_id = rl.request_id
         WHERE o.event_id = $1
         ORDER BY m.created_at DESC`,
        [eventId]
      );
      
      res.json({ matches: matchesResult.rows });
    } else {
      // In-memory storage
      const eventOffers = db.carpool_offers.filter(o => o.event_id === eventId);
      const offerIds = eventOffers.map(o => o.offer_id);
      const matches = db.matches.filter(m => offerIds.includes(m.offer_id)).map(m => {
        const driver = db.users.find(u => u.user_id === m.driver_id);
        const passenger = db.users.find(u => u.user_id === m.passenger_id);
        const location = db.request_locations.find(l => l.request_id === m.request_id);
        return {
          ...m,
          driver_name: driver?.name,
          driver_phone: driver?.phone,
          passenger_name: passenger?.name,
          passenger_phone: passenger?.phone,
          pickup_location: location?.location_address
        };
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      res.json({ matches });
    }
  } catch (error) {
    console.error('Error getting matches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/event/:eventId/send-reminders', authenticateToken, requireEventAdmin, async (req, res) => {
  console.log('Sending reminders for event:', req.params.eventId);
  res.json({ success: true, reminders_sent: 0 });
});

app.get('/api/admin/event/:eventId/export', authenticateToken, requireEventAdmin, async (req, res) => {
  res.json({ success: true, download_url: '/exports/data.csv' });
});

// =======================
// EDIT/DELETE ENDPOINTS
// =======================

// Update offer
app.put('/api/carpool/offer/:offerId', authenticateToken, async (req, res) => {
  try {
    const { offerId } = req.params;
    const { name, phone, email, total_seats, description, trip_type, preference, locations } = req.body;

    // Verify ownership
    if (!isOfferOwner(req.account, offerId)) {
      return res.status(403).json({ message: 'Not authorized to update this offer' });
    }

    if (useDatabase && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Get driver_id from offer
        const offerResult = await client.query('SELECT driver_id FROM carpool_offers WHERE offer_id = $1', [offerId]);
        if (offerResult.rows.length === 0) {
          return res.status(404).json({ message: 'Offer not found' });
        }
        const driverId = offerResult.rows[0].driver_id;
        
        // Update user
        await client.query(
          'UPDATE users SET name = $1, phone = $2, email = $3 WHERE user_id = $4',
          [name, phone, email, driverId]
        );
        
        // Update offer
        await client.query(
          'UPDATE carpool_offers SET total_seats = $1, description = $2, trip_type = $3, updated_at = NOW() WHERE offer_id = $4',
          [total_seats, description, trip_type, offerId]
        );
        
        // Delete old locations
        await client.query('DELETE FROM offer_locations WHERE offer_id = $1', [offerId]);
        
        // Insert new locations
        for (let i = 0; i < locations.length; i++) {
          const loc = locations[i];
          await client.query(
            'INSERT INTO offer_locations (offer_id, location_address, trip_direction, time_type, specific_time, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
            [offerId, loc.location_address, loc.trip_direction, loc.time_type, loc.specific_time, i]
          );
        }
        
        await client.query('COMMIT');
        res.json({ offer_id: offerId, success: true });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // In-memory storage
      const offer = db.carpool_offers.find(o => o.offer_id === offerId);
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }
      
      // Update user
      const user = db.users.find(u => u.user_id === offer.driver_id);
      if (user) {
        user.name = name;
        user.phone = phone;
        user.email = email;
      }
      
      // Update offer
      offer.total_seats = total_seats;
      offer.description = description;
      offer.trip_type = trip_type;
      offer.preference = preference || 'any';
      offer.updated_at = new Date();
      
      // Remove old locations
      db.offer_locations = db.offer_locations.filter(l => l.offer_id !== offerId);
      
      // Add new locations
      locations.forEach((loc, i) => {
        db.offer_locations.push({
          location_id: db.offer_locations.length + 1,
          offer_id: offerId,
          location_address: loc.location_address,
          trip_direction: loc.trip_direction,
          time_type: loc.time_type,
          specific_time: loc.specific_time,
          sort_order: i
        });
      });
      
      res.json({ offer_id: offerId, success: true });
    }
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete offer
app.delete('/api/carpool/offer/:offerId', authenticateToken, async (req, res) => {
  try {
    const { offerId } = req.params;

    // Verify ownership
    if (!isOfferOwner(req.account, offerId)) {
      return res.status(403).json({ message: 'Not authorized to delete this offer' });
    }

    if (useDatabase && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM offer_locations WHERE offer_id = $1', [offerId]);
        await client.query('DELETE FROM matches WHERE offer_id = $1', [offerId]);
        await client.query('DELETE FROM carpool_offers WHERE offer_id = $1', [offerId]);
        await client.query('COMMIT');
        res.json({ success: true });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // In-memory storage
      db.offer_locations = db.offer_locations.filter(l => l.offer_id !== offerId);
      db.matches = db.matches.filter(m => m.offer_id !== offerId);
      db.carpool_offers = db.carpool_offers.filter(o => o.offer_id !== offerId);
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request
app.put('/api/carpool/request/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { name, phone, email, trip_type, preference, locations } = req.body;

    // Verify ownership
    if (!isRequestOwner(req.account, requestId)) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }

    if (useDatabase && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Get passenger_id from request
        const requestResult = await client.query('SELECT passenger_id FROM carpool_requests WHERE request_id = $1', [requestId]);
        if (requestResult.rows.length === 0) {
          return res.status(404).json({ message: 'Request not found' });
        }
        const passengerId = requestResult.rows[0].passenger_id;
        
        // Update user
        await client.query(
          'UPDATE users SET name = $1, phone = $2, email = $3 WHERE user_id = $4',
          [name, phone, email, passengerId]
        );
        
        // Update request
        await client.query(
          'UPDATE carpool_requests SET trip_type = $1, updated_at = NOW() WHERE request_id = $2',
          [trip_type, requestId]
        );
        
        // Delete old locations
        await client.query('DELETE FROM request_locations WHERE request_id = $1', [requestId]);
        
        // Insert new locations
        for (let i = 0; i < locations.length; i++) {
          const loc = locations[i];
          await client.query(
            'INSERT INTO request_locations (request_id, location_address, trip_direction, time_type, specific_time, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
            [requestId, loc.location_address, loc.trip_direction, loc.time_type, loc.specific_time, i]
          );
        }
        
        await client.query('COMMIT');
        res.json({ request_id: requestId, success: true });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // In-memory storage
      const request = db.carpool_requests.find(r => r.request_id === requestId);
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
      
      // Update user
      const user = db.users.find(u => u.user_id === request.passenger_id);
      if (user) {
        user.name = name;
        user.phone = phone;
        user.email = email;
      }
      
      // Update request
      request.trip_type = trip_type;
      request.preference = preference || 'any';
      request.updated_at = new Date();
      
      // Remove old locations
      db.request_locations = db.request_locations.filter(l => l.request_id !== requestId);
      
      // Add new locations
      locations.forEach((loc, i) => {
        db.request_locations.push({
          location_id: db.request_locations.length + 1,
          request_id: requestId,
          location_address: loc.location_address,
          trip_direction: loc.trip_direction,
          time_type: loc.time_type,
          specific_time: loc.specific_time,
          sort_order: i
        });
      });
      
      res.json({ request_id: requestId, success: true });
    }
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete request
app.delete('/api/carpool/request/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Verify ownership
    if (!isRequestOwner(req.account, requestId)) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }

    if (useDatabase && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM request_locations WHERE request_id = $1', [requestId]);
        await client.query('DELETE FROM matches WHERE request_id = $1', [requestId]);
        await client.query('DELETE FROM carpool_requests WHERE request_id = $1', [requestId]);
        await client.query('COMMIT');
        res.json({ success: true });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      // In-memory storage
      db.request_locations = db.request_locations.filter(l => l.request_id !== requestId);
      db.matches = db.matches.filter(m => m.request_id !== requestId);
      db.carpool_requests = db.carpool_requests.filter(r => r.request_id !== requestId);
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// JOIN REQUEST SYSTEM (for passengers to request joining an offer)
// =======================

// In-memory storage for join requests (separate from matches)
if (!db.join_requests) {
  db.join_requests = [];
}

// Request to join an offer (passenger initiated)
app.post('/api/carpool/offer/:offerId/request-join', async (req, res) => {
  try {
    const { offerId } = req.params;
    const { name, phone, email, pickup_location, pickup_lat, pickup_lng, message, passenger_count } = req.body;
    
    console.log('Received join request for offer:', offerId);
    console.log('Request body:', req.body);
    console.log('Pickup location data:', { pickup_location, pickup_lat, pickup_lng });
    console.log('Message:', message);
    
    // Check for authentication (optional - allows both authenticated and unauthenticated users)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let account = null;
    
    if (token) {
      const session = db.sessions.find(s => s.token === token && s.expires_at > new Date());
      if (session) {
        account = db.accounts.find(a => a.account_id === session.account_id);
        console.log('Authenticated user joining:', account?.name);
      }
    }
    
    const joinRequestId = generateId('join');
    
    // Check if already requested
    const existingRequest = db.join_requests.find(
      jr => jr.offer_id === offerId && jr.phone === phone && jr.status === 'pending'
    );
    if (existingRequest) {
      return res.status(400).json({ message: 'You have already requested to join this ride' });
    }
    
    // Check if offer has available seats
    const offer = db.carpool_offers.find(o => o.offer_id === offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    
    const confirmedCount = db.join_requests.filter(
      jr => jr.offer_id === offerId && jr.status === 'confirmed'
    ).length;
    
    if (confirmedCount >= offer.total_seats) {
      return res.status(400).json({ message: 'This ride is full' });
    }
    
    // Ensure pickup coordinates are properly parsed
    let parsedLat = null;
    let parsedLng = null;
    
    if (pickup_lat != null && pickup_lat !== '') {
      parsedLat = typeof pickup_lat === 'number' ? pickup_lat : parseFloat(pickup_lat);
      if (isNaN(parsedLat)) parsedLat = null;
    }
    
    if (pickup_lng != null && pickup_lng !== '') {
      parsedLng = typeof pickup_lng === 'number' ? pickup_lng : parseFloat(pickup_lng);
      if (isNaN(parsedLng)) parsedLng = null;
    }
    
    const joinRequest = {
      id: joinRequestId,
      offer_id: offerId,
      account_id: account?.account_id || null, // Store account_id if authenticated
      name,
      phone,
      email,
      pickup_location: pickup_location || null,
      pickup_lat: parsedLat,
      pickup_lng: parsedLng,
      message: message || null,
      passenger_count: parseInt(passenger_count) || 1,
      status: 'pending',
      created_at: new Date()
    };
    
    console.log('Saving join request:', joinRequest);
    console.log('Parsed coordinates:', { parsedLat, parsedLng, originalLat: pickup_lat, originalLng: pickup_lng });
    db.join_requests.push(joinRequest);
    
    res.json({ success: true, join_request_id: joinRequestId });
  } catch (error) {
    console.error('Error requesting to join:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get join requests for an offer (driver view)
app.get('/api/carpool/offer/:offerId/join-requests', authenticateToken, async (req, res) => {
  try {
    const { offerId } = req.params;

    // Verify ownership
    if (!isOfferOwner(req.account, offerId)) {
      return res.status(403).json({ message: 'Not authorized to view these requests' });
    }

    const requests = db.join_requests
      .filter(jr => jr.offer_id === offerId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    console.log(`Found ${requests.length} join requests for offer ${offerId}:`, requests);

    res.json({ requests });
  } catch (error) {
    console.error('Error getting join requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept join request (driver action)
app.post('/api/carpool/offer/:offerId/accept-join/:requestId', authenticateToken, async (req, res) => {
  try {
    const { offerId, requestId } = req.params;

    // Verify ownership
    if (!isOfferOwner(req.account, offerId)) {
      return res.status(403).json({ message: 'Not authorized to manage this offer' });
    }

    const joinRequest = db.join_requests.find(
      jr => jr.id === requestId && jr.offer_id === offerId
    );

    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    // Check if offer has available seats
    const offer = db.carpool_offers.find(o => o.offer_id === offerId);
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const confirmedCount = db.join_requests.filter(
      jr => jr.offer_id === offerId && jr.status === 'confirmed'
    ).length;

    if (confirmedCount >= offer.total_seats) {
      return res.status(400).json({ message: 'This ride is full' });
    }

    joinRequest.status = 'confirmed';
    joinRequest.confirmed_at = new Date();

    // Update available seats (safe - never go below 0)
    offer.available_seats = Math.max(0, offer.total_seats - (confirmedCount + 1));

    res.json({ success: true });
  } catch (error) {
    console.error('Error accepting join request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject join request (driver action)
app.post('/api/carpool/offer/:offerId/reject-join/:requestId', authenticateToken, async (req, res) => {
  try {
    const { offerId, requestId } = req.params;

    // Verify ownership
    if (!isOfferOwner(req.account, offerId)) {
      return res.status(403).json({ message: 'Not authorized to manage this offer' });
    }

    const joinRequest = db.join_requests.find(
      jr => jr.id === requestId && jr.offer_id === offerId
    );

    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    joinRequest.status = 'rejected';

    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting join request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel confirmed passenger (driver action)
app.post('/api/carpool/offer/:offerId/cancel-passenger', authenticateToken, async (req, res) => {
  try {
    const { offerId } = req.params;
    const { passenger_id, message } = req.body;

    // Verify ownership
    if (!isOfferOwner(req.account, offerId)) {
      return res.status(403).json({ message: 'Not authorized to manage this offer' });
    }

    const joinRequest = db.join_requests.find(
      jr => jr.id === passenger_id && jr.offer_id === offerId && jr.status === 'confirmed'
    );

    if (!joinRequest) {
      return res.status(404).json({ message: 'Confirmed passenger not found' });
    }

    // Update the status to cancelled
    joinRequest.status = 'cancelled';
    joinRequest.cancelled_at = new Date();
    joinRequest.cancel_message = message || null;

    // Update available seats for the offer
    const offer = db.carpool_offers.find(o => o.offer_id === offerId);
    if (offer) {
      const confirmedCount = db.join_requests.filter(
        jr => jr.offer_id === offerId && jr.status === 'confirmed'
      ).length;
      offer.available_seats = Math.max(0, offer.total_seats - confirmedCount);
    }

    // TODO: Send notification to the passenger (via SMS/email) about cancellation with message
    console.log(`Passenger ${joinRequest.name} cancelled from offer ${offerId}. Message: ${message}`);

    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling passenger:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// AUTHENTICATION APIS
// =======================

// Request OTP for login/register
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone || phone.trim().length < 7) {
      return res.status(400).json({ message: 'Valid phone number is required' });
    }
    
    // Normalize phone number to E.164 format (+972...)
    const normalizedPhone = formatPhoneNumber(phone);
    
    // Check if there's a recent OTP (prevent spam)
    const recentOTP = db.otp_codes.find(
      o => o.phone === normalizedPhone && 
      o.expires_at > new Date() && 
      (new Date() - new Date(o.created_at)) < 60000 // Less than 1 minute ago
    );
    
    if (recentOTP) {
      return res.status(429).json({ 
        message: 'Please wait before requesting another OTP',
        retry_after: 60 - Math.floor((new Date() - new Date(recentOTP.created_at)) / 1000)
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const otpId = generateId('otp');
    
    // Store OTP (expires in 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // Remove any existing OTPs for this phone
    db.otp_codes = db.otp_codes.filter(o => o.phone !== normalizedPhone);
    
    db.otp_codes.push({
      id: otpId,
      phone: normalizedPhone,
      otp: otp,
      created_at: new Date(),
      expires_at: expiresAt,
      verified: false
    });
    
    // Check if account exists with this phone number
    const existingAccount = db.accounts.find(a => a.phone === normalizedPhone);
    
    // Send SMS
    const message = existingAccount 
      ? `Your Carpool login code is: ${otp}. Valid for 5 minutes.`
      : `Your Carpool verification code is: ${otp}. Valid for 5 minutes.`;
    await sendSMS(normalizedPhone, message);
    
    const response = {
      success: true,
      message: existingAccount 
        ? 'Login code sent! You already have an account.'
        : 'Verification code sent! Create your account.',
      is_new_user: !existingAccount,
      account_exists: !!existingAccount,
      formatted_phone: normalizedPhone
    };

    // Only include debug OTP in development mode - NEVER in production
    if (!isProduction) {
      response.debug_otp = otp;
    }

    res.json(response);
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP and login/register
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name, email, gender } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }
    
    // Normalize phone number to E.164 format (+972...)
    const normalizedPhone = formatPhoneNumber(phone);
    
    // Development bypass: accept 123456 as valid OTP in non-production
    const isDevelopmentBypass = !isProduction && otp === '123456';
    
    // Find valid OTP
    const otpRecord = db.otp_codes.find(
      o => o.phone === normalizedPhone && 
      o.otp === otp && 
      o.expires_at > new Date() &&
      !o.verified
    );
    
    if (!otpRecord && !isDevelopmentBypass) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    // Mark OTP as verified (if it exists)
    if (otpRecord) {
      otpRecord.verified = true;
    } else if (isDevelopmentBypass) {
      console.log(`🔓 Development OTP bypass used for phone: ${normalizedPhone}`);
    }
    
    // Check if account exists
    let account = db.accounts.find(a => a.phone === normalizedPhone);
    
    if (!account) {
      // New user - require name, email, and gender
      if (!name || !email || !gender) {
        return res.status(400).json({ 
          message: 'Name, email, and gender are required for new users',
          requires_registration: true
        });
      }
      
      // Validate email
      if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      
      // Validate gender
      if (gender !== 'male' && gender !== 'female') {
        return res.status(400).json({ message: 'Gender must be male or female' });
      }
      
      // Create new account
      const accountId = generateId('account');
      account = {
        account_id: accountId,
        phone: normalizedPhone,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        gender: gender,
        created_at: new Date(),
        updated_at: new Date()
      };
      db.accounts.push(account);
      console.log(`✅ New account created: ${account.name} (${account.phone}, ${account.gender})`);
    } else {
      // Update existing account with gender if provided
      if (gender && (gender === 'male' || gender === 'female')) {
        account.gender = gender;
        account.updated_at = new Date();
      }
    }
    
    // Create session token
    const sessionToken = generateSessionToken();
    const sessionId = generateId('session');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Remove old sessions for this account
    db.sessions = db.sessions.filter(s => s.account_id !== account.account_id);
    
    db.sessions.push({
      session_id: sessionId,
      account_id: account.account_id,
      token: sessionToken,
      created_at: new Date(),
      expires_at: expiresAt,
      last_used: new Date()
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      token: sessionToken,
      account: {
        account_id: account.account_id,
        name: account.name,
        phone: account.phone,
        email: account.email,
        gender: account.gender
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify session token (middleware helper)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const session = db.sessions.find(
    s => s.token === token && s.expires_at > new Date()
  );

  if (!session) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }

  // Update last used
  session.last_used = new Date();

  // Get account
  const account = db.accounts.find(a => a.account_id === session.account_id);
  if (!account) {
    return res.status(401).json({ message: 'Account not found' });
  }

  req.account = account;
  next();
}

// Optional authentication - sets req.account if token present, but doesn't require it
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const session = db.sessions.find(
      s => s.token === token && s.expires_at > new Date()
    );
    if (session) {
      session.last_used = new Date();
      const account = db.accounts.find(a => a.account_id === session.account_id);
      if (account) {
        req.account = account;
      }
    }
  }
  next();
}

// Helper to check if user is the event creator
function isEventCreator(account, eventId) {
  if (!account) return false;
  const event = db.events.find(e => e.event_id === eventId);
  return event && event.creator_account_id === account.account_id;
}

// Helper to check if user owns an offer
function isOfferOwner(account, offerId) {
  if (!account) return false;
  const offer = db.carpool_offers.find(o => o.offer_id === offerId);
  return offer && offer.account_id === account.account_id;
}

// Helper to check if user owns a request
function isRequestOwner(account, requestId) {
  if (!account) return false;
  const request = db.carpool_requests.find(r => r.request_id === requestId);
  return request && request.account_id === account.account_id;
}

// Middleware to verify event admin access
function requireEventAdmin(req, res, next) {
  const eventId = req.params.eventId;
  const eventCode = req.params.eventCode;

  let event = null;
  if (eventId) {
    event = db.events.find(e => e.event_id === eventId);
  } else if (eventCode) {
    event = db.events.find(e => e.event_code === eventCode);
  }

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  if (event.creator_account_id !== req.account.account_id) {
    return res.status(403).json({ message: 'Not authorized to manage this event' });
  }

  req.event = event;
  next();
}

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    account: {
      account_id: req.account.account_id,
      name: req.account.name,
      phone: req.account.phone,
      email: req.account.email,
      gender: req.account.gender
    }
  });
});

// Update account
app.put('/api/auth/account', authenticateToken, async (req, res) => {
  try {
    const { name, email, gender } = req.body;
    
    if (name) req.account.name = name.trim();
    if (email) {
      if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      req.account.email = email.trim().toLowerCase();
    }
    if (gender && (gender === 'male' || gender === 'female')) {
      req.account.gender = gender;
    }
    req.account.updated_at = new Date();
    
    res.json({
      success: true,
      account: {
        account_id: req.account.account_id,
        name: req.account.name,
        phone: req.account.phone,
        email: req.account.email,
        gender: req.account.gender
      }
    });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  db.sessions = db.sessions.filter(s => s.account_id !== req.account.account_id);
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get user's offers
app.get('/api/auth/my-offers', authenticateToken, async (req, res) => {
  try {
    const offers = db.carpool_offers.filter(o => o.account_id === req.account.account_id);
    
    const result = offers.map(offer => {
      const locations = db.offer_locations.filter(l => l.offer_id === offer.offer_id);
      const event = db.events.find(e => e.event_id === offer.event_id);
      
      // Get confirmed passengers count
      const confirmedCount = db.join_requests 
        ? db.join_requests.filter(jr => jr.offer_id === offer.offer_id && jr.status === 'confirmed').length 
        : 0;
      
      return {
        ...offer,
        locations,
        event_name: event?.event_name,
        event_date: event?.event_date,
        event_code: event?.event_code,
        confirmed_passengers: confirmedCount
      };
    });
    
    res.json({ offers: result });
  } catch (error) {
    console.error('Error getting user offers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's requests
app.get('/api/auth/my-requests', authenticateToken, async (req, res) => {
  try {
    const requests = db.carpool_requests.filter(r => r.account_id === req.account.account_id);
    
    const result = requests.map(request => {
      const locations = db.request_locations.filter(l => l.request_id === request.request_id);
      const event = db.events.find(e => e.event_id === request.event_id);
      
      // Check if matched
      const match = db.matches.find(m => m.request_id === request.request_id && m.status === 'confirmed');
      let matchedDriver = null;
      if (match) {
        const offer = db.carpool_offers.find(o => o.offer_id === match.offer_id);
        const driverAccount = db.accounts.find(a => a.account_id === offer?.account_id);
        matchedDriver = {
          name: driverAccount?.name,
          phone: driverAccount?.phone,
          description: offer?.description
        };
      }
      
      return {
        ...request,
        locations,
        event_name: event?.event_name,
        event_date: event?.event_date,
        event_code: event?.event_code,
        matched_driver: matchedDriver
      };
    });
    
    res.json({ requests: result });
  } catch (error) {
    console.error('Error getting user requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all join requests sent by the user (all statuses)
app.get('/api/auth/my-join-requests', authenticateToken, async (req, res) => {
  try {
    const account = req.account;
    console.log('=== GET MY JOIN REQUESTS ===');
    console.log('Account:', account.account_id, account.name, account.phone, account.email);
    
    // Find all join requests by this user (all statuses)
    const myJoinRequests = db.join_requests.filter(jr => {
      if (jr.account_id && account.account_id && jr.account_id === account.account_id) {
        return true;
      }
      const phoneMatch = jr.phone && account.phone && jr.phone === account.phone;
      const emailMatch = jr.email && account.email && jr.email.toLowerCase() === account.email.toLowerCase();
      return phoneMatch || emailMatch;
    });
    
    console.log('Found join requests:', myJoinRequests.length);
    
    const result = myJoinRequests.map(jr => {
      const offer = db.carpool_offers.find(o => o.offer_id === jr.offer_id);
      if (!offer) return null;
      
      const event = db.events.find(e => e.event_id === offer.event_id);
      
      // Get driver info
      const driverAccount = db.accounts.find(a => a.account_id === offer.account_id);
      const driverUser = db.users.find(u => u.user_id === offer.driver_id);
      
      return {
        id: jr.id,
        offer_id: offer.offer_id,
        status: jr.status,
        pickup_location: jr.pickup_location,
        pickup_lat: jr.pickup_lat,
        pickup_lng: jr.pickup_lng,
        message: jr.message,
        passenger_count: jr.passenger_count || 1,
        created_at: jr.created_at,
        confirmed_at: jr.confirmed_at,
        // Driver info
        driver_name: driverAccount?.name || driverUser?.name || 'Unknown',
        driver_phone: driverAccount?.phone || driverUser?.phone,
        driver_email: driverAccount?.email || driverUser?.email,
        // Event details
        event_id: event?.event_id,
        event_name: event?.event_name,
        event_date: event?.event_date,
        event_time: event?.event_time,
        event_location: event?.event_location,
        event_code: event?.event_code,
      };
    }).filter(r => r !== null);
    
    console.log('Returning join requests:', result.length);
    res.json({ requests: result });
  } catch (error) {
    console.error('Error getting join requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get rides where user is a passenger (join requests)
app.get('/api/auth/my-joined-rides', authenticateToken, async (req, res) => {
  try {
    const account = req.account;
    console.log('=== GET MY JOINED RIDES ===');
    console.log('Account:', account.account_id, account.name, account.phone, account.email);
    
    // Find all join requests where:
    // 1. account_id matches (if stored), OR
    // 2. phone or email matches the authenticated user
    const myJoinRequests = db.join_requests.filter(jr => {
      // First check by account_id (most reliable)
      if (jr.account_id && account.account_id && jr.account_id === account.account_id) {
        return true;
      }
      // Fallback to phone/email matching
      const phoneMatch = jr.phone && account.phone && jr.phone === account.phone;
      const emailMatch = jr.email && account.email && jr.email.toLowerCase() === account.email.toLowerCase();
      return phoneMatch || emailMatch;
    });
    
    console.log('Found join requests:', myJoinRequests.length);
    
    const result = myJoinRequests.map(jr => {
      const offer = db.carpool_offers.find(o => o.offer_id === jr.offer_id);
      if (!offer) return null;
      
      const event = db.events.find(e => e.event_id === offer.event_id);
      const offerLocations = db.offer_locations.filter(l => l.offer_id === offer.offer_id);
      
      // Get driver info
      const driverAccount = db.accounts.find(a => a.account_id === offer.account_id);
      const driverUser = db.users.find(u => u.user_id === offer.driver_id);
      
      return {
        join_request_id: jr.id,
        offer_id: offer.offer_id,
        status: jr.status,
        pickup_location: jr.pickup_location,
        pickup_lat: jr.pickup_lat,
        pickup_lng: jr.pickup_lng,
        message: jr.message,
        created_at: jr.created_at,
        confirmed_at: jr.confirmed_at,
        // Driver info
        driver_name: driverAccount?.name || driverUser?.name || 'Unknown',
        driver_phone: driverAccount?.phone || driverUser?.phone || 'Unknown',
        driver_email: driverAccount?.email || driverUser?.email,
        // Offer details
        offer_locations: offerLocations,
        total_seats: offer.total_seats,
        available_seats: offer.available_seats,
        trip_type: offer.trip_type,
        // Event details
        event_id: event?.event_id,
        event_name: event?.event_name,
        event_date: event?.event_date,
        event_time: event?.event_time,
        event_location: event?.event_location,
        event_code: event?.event_code,
      };
    }).filter(r => r !== null); // Remove null entries
    
    console.log('Returning joined rides:', result.length);
    res.json({ rides: result });
  } catch (error) {
    console.error('Error getting joined rides:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// EVENT MANAGEMENT APIs (for event creators)
// =======================

// Get my events (events I created AND events I joined)
app.get('/api/auth/my-events', authenticateToken, async (req, res) => {
  try {
    console.log('=== GET MY EVENTS ===');
    console.log('Account ID:', req.account.account_id);
    console.log('Account name:', req.account.name);
    
    // Get events I created
    const createdEvents = db.events.filter(e => e.creator_account_id === req.account.account_id && e.status === 'active');
    
    // Get events I joined (as participant)
    const joinedEventIds = db.event_participants
      .filter(p => p.account_id === req.account.account_id)
      .map(p => p.event_id);
    
    const joinedEvents = db.events.filter(e => 
      joinedEventIds.includes(e.event_id) && 
      e.status === 'active' &&
      e.creator_account_id !== req.account.account_id // Don't duplicate created events
    );
    
    // Combine all events
    const allEvents = [...createdEvents, ...joinedEvents];
    
    console.log('Created events:', createdEvents.length);
    console.log('Joined events:', joinedEvents.length);
    console.log('Total events:', allEvents.length);
    
    const result = allEvents.map(event => {
      // Get stats for each event
      const offers = db.carpool_offers.filter(o => o.event_id === event.event_id && o.status === 'active');
      const requests = db.carpool_requests.filter(r => r.event_id === event.event_id && r.status === 'active');
      const totalSeats = offers.reduce((sum, o) => sum + o.total_seats, 0);
      const confirmedPassengers = db.join_requests 
        ? db.join_requests.filter(jr => offers.some(o => o.offer_id === jr.offer_id) && jr.status === 'confirmed').length
        : 0;
      
      // Determine user's role in this event
      const isCreator = event.creator_account_id === req.account.account_id;
      const isParticipant = joinedEventIds.includes(event.event_id);
      
      return {
        ...event,
        user_role: isCreator ? 'creator' : 'participant',
        is_creator: isCreator,
        is_participant: isParticipant,
        stats: {
          total_drivers: offers.length,
          total_passengers: requests.length,
          total_seats: totalSeats,
          confirmed_passengers: confirmedPassengers
        }
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({ events: result });
  } catch (error) {
    console.error('Error getting user events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event admin data (full details for event owner)
app.get('/api/event/:eventCode/admin', authenticateToken, requireEventAdmin, async (req, res) => {
  try {
    const { eventCode } = req.params;

    console.log('=== GET EVENT ADMIN ===');
    console.log('Event code:', eventCode);
    
    // Check for authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let account = null;
    
    console.log('Auth header present:', !!authHeader);
    console.log('Token extracted:', token ? token.substring(0, 10) + '...' : 'none');
    
    if (token) {
      const session = db.sessions.find(s => s.token === token && s.expires_at > new Date());
      console.log('Session found:', !!session);
      if (session) {
        account = db.accounts.find(a => a.account_id === session.account_id);
        console.log('Account found:', account ? account.name : 'none');
      }
    }
    
    const event = db.events.find(e => e.event_code === eventCode);
    console.log('Event found:', event ? event.event_name : 'NOT FOUND');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    console.log('Event creator_account_id:', event.creator_account_id);
    console.log('Current user account_id:', account?.account_id);
    
    // Check if user is the event creator
    const isOwner = account && event.creator_account_id === account.account_id;
    console.log('Is owner:', isOwner);
    
    if (!isOwner) {
      console.log('ACCESS DENIED - user is not the owner');
      return res.status(403).json({ message: 'You are not authorized to manage this event' });
    }
    
    // Get all offers with details
    const offers = db.carpool_offers.filter(o => o.event_id === event.event_id).map(offer => {
      const driver = db.users.find(u => u.user_id === offer.driver_id);
      const locations = db.offer_locations.filter(l => l.offer_id === offer.offer_id);
      const joinReqs = db.join_requests ? db.join_requests.filter(jr => jr.offer_id === offer.offer_id) : [];
      
      return {
        ...offer,
        driver_name: driver?.name,
        driver_phone: driver?.phone,
        driver_email: driver?.email,
        locations,
        passengers: joinReqs.filter(jr => jr.status === 'confirmed'),
        pending_requests: joinReqs.filter(jr => jr.status === 'pending')
      };
    });
    
    // Get all requests with details
    const requests = db.carpool_requests.filter(r => r.event_id === event.event_id).map(request => {
      const passenger = db.users.find(u => u.user_id === request.passenger_id);
      const locations = db.request_locations.filter(l => l.request_id === request.request_id);
      const match = db.matches.find(m => m.request_id === request.request_id && m.status === 'confirmed');
      
      return {
        ...request,
        name: passenger?.name,
        phone: passenger?.phone,
        email: passenger?.email,
        locations,
        is_matched: !!match
      };
    });
    
    // Calculate stats
    const stats = {
      total_drivers: offers.filter(o => o.status === 'active').length,
      total_passengers: requests.filter(r => r.status === 'active').length,
      total_seats: offers.filter(o => o.status === 'active').reduce((sum, o) => sum + o.total_seats, 0),
      confirmed_passengers: offers.reduce((sum, o) => sum + o.passengers.length, 0),
      pending_requests: offers.reduce((sum, o) => sum + o.pending_requests.length, 0)
    };
    
    res.json({
      event,
      offers,
      requests,
      stats,
      is_owner: true
    });
  } catch (error) {
    console.error('Error getting event admin data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event (for event owner)
app.put('/api/event/:eventCode', authenticateToken, requireEventAdmin, async (req, res) => {
  try {
    const { eventCode } = req.params;
    const { eventName, eventDate, eventTime, eventLocation, eventLat, eventLng, isPrivate, accessCode } = req.body;

    const event = req.event; // Set by requireEventAdmin middleware

    // Update event
    if (eventName) event.event_name = eventName;
    if (eventDate) event.event_date = eventDate;
    if (eventTime) event.event_time = eventTime;
    if (eventLocation) event.event_location = eventLocation;
    if (eventLat !== undefined) event.event_lat = eventLat;
    if (eventLng !== undefined) event.event_lng = eventLng;
    if (typeof isPrivate === 'boolean') event.is_private = isPrivate;
    if (accessCode !== undefined) event.access_code = isPrivate ? accessCode : null;
    event.updated_at = new Date();
    
    res.json({ success: true, event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event (for event owner)
app.delete('/api/event/:eventCode', authenticateToken, requireEventAdmin, async (req, res) => {
  try {
    const event = req.event; // Set by requireEventAdmin middleware

    // Remove event (or mark as deleted)
    event.status = 'deleted';
    
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a driver/offer from event (admin action)
app.delete('/api/event/:eventCode/offer/:offerId', async (req, res) => {
  try {
    const { eventCode, offerId } = req.params;
    
    // Check for authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let account = null;
    
    if (token) {
      const session = db.sessions.find(s => s.token === token && s.expires_at > new Date());
      if (session) {
        account = db.accounts.find(a => a.account_id === session.account_id);
      }
    }
    
    const event = db.events.find(e => e.event_code === eventCode);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the event creator
    if (!account || event.creator_account_id !== account.account_id) {
      return res.status(403).json({ message: 'You are not authorized to manage this event' });
    }
    
    // Remove offer
    const offerIndex = db.carpool_offers.findIndex(o => o.offer_id === offerId && o.event_id === event.event_id);
    if (offerIndex === -1) {
      return res.status(404).json({ message: 'Offer not found' });
    }
    
    db.carpool_offers[offerIndex].status = 'removed';
    
    res.json({ success: true, message: 'Driver removed from event' });
  } catch (error) {
    console.error('Error removing offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a passenger/request from event (admin action)
app.delete('/api/event/:eventCode/request/:requestId', async (req, res) => {
  try {
    const { eventCode, requestId } = req.params;
    
    // Check for authentication
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let account = null;
    
    if (token) {
      const session = db.sessions.find(s => s.token === token && s.expires_at > new Date());
      if (session) {
        account = db.accounts.find(a => a.account_id === session.account_id);
      }
    }
    
    const event = db.events.find(e => e.event_code === eventCode);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the event creator
    if (!account || event.creator_account_id !== account.account_id) {
      return res.status(403).json({ message: 'You are not authorized to manage this event' });
    }
    
    // Remove request
    const requestIndex = db.carpool_requests.findIndex(r => r.request_id === requestId && r.event_id === event.event_id);
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    db.carpool_requests[requestIndex].status = 'removed';
    
    res.json({ success: true, message: 'Passenger removed from event' });
  } catch (error) {
    console.error('Error removing request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  if (SMS_PROVIDER === 'mock') {
    console.log(`📱 SMS Provider: MOCK (OTP codes will be logged to console)`);
  } else {
    console.log(`📱 SMS Provider: ${SMS_PROVIDER}`);
  }
});