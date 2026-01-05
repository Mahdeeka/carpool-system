/**
 * PostgreSQL Database Module
 * Provides persistent storage for the carpool system
 */

const { Pool } = require('pg');

// Database connection pool
let pool = null;

// Initialize database connection
function initDatabase() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.log('⚠️ DATABASE_URL not set - using in-memory storage');
    return null;
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });

    console.log('✅ PostgreSQL database connected');
    return pool;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    return null;
  }
}

// Create tables if they don't exist
async function createTables() {
  if (!pool) return false;

  const createTablesSQL = `
    -- Accounts table
    CREATE TABLE IF NOT EXISTS accounts (
      account_id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255),
      gender VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Sessions table
    CREATE TABLE IF NOT EXISTS sessions (
      session_id VARCHAR(50) PRIMARY KEY,
      account_id VARCHAR(50) REFERENCES accounts(account_id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- OTP codes table
    CREATE TABLE IF NOT EXISTS otp_codes (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(50) NOT NULL,
      otp VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      verified BOOLEAN DEFAULT FALSE
    );

    -- Events table
    CREATE TABLE IF NOT EXISTS events (
      event_id VARCHAR(50) PRIMARY KEY,
      event_code VARCHAR(20) UNIQUE NOT NULL,
      event_name VARCHAR(255) NOT NULL,
      event_date DATE NOT NULL,
      event_time TIME,
      event_location TEXT,
      location_lat DECIMAL(10, 8),
      location_lng DECIMAL(11, 8),
      event_description TEXT,
      creator_account_id VARCHAR(50) REFERENCES accounts(account_id) ON DELETE SET NULL,
      creator_phone VARCHAR(50),
      creator_name VARCHAR(255),
      access_code VARCHAR(50),
      is_private BOOLEAN DEFAULT FALSE,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Carpool offers table
    CREATE TABLE IF NOT EXISTS carpool_offers (
      offer_id VARCHAR(50) PRIMARY KEY,
      event_id VARCHAR(50) REFERENCES events(event_id) ON DELETE CASCADE,
      driver_id VARCHAR(50),
      owner_account_id VARCHAR(50) REFERENCES accounts(account_id) ON DELETE SET NULL,
      name VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      gender VARCHAR(20),
      pickup_location TEXT,
      pickup_lat DECIMAL(10, 8),
      pickup_lng DECIMAL(11, 8),
      total_seats INTEGER DEFAULT 1,
      available_seats INTEGER DEFAULT 1,
      departure_time TIME,
      trip_type VARCHAR(20) DEFAULT 'to_event',
      notes TEXT,
      preference VARCHAR(50),
      payment_required VARCHAR(20) DEFAULT 'free',
      payment_amount DECIMAL(10, 2),
      payment_method VARCHAR(50),
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Carpool requests table
    CREATE TABLE IF NOT EXISTS carpool_requests (
      request_id VARCHAR(50) PRIMARY KEY,
      event_id VARCHAR(50) REFERENCES events(event_id) ON DELETE CASCADE,
      passenger_id VARCHAR(50),
      owner_account_id VARCHAR(50) REFERENCES accounts(account_id) ON DELETE SET NULL,
      name VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      gender VARCHAR(20),
      pickup_location TEXT,
      pickup_lat DECIMAL(10, 8),
      pickup_lng DECIMAL(11, 8),
      passenger_count INTEGER DEFAULT 1,
      trip_type VARCHAR(20) DEFAULT 'to_event',
      notes TEXT,
      preference VARCHAR(50),
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Join requests table (passengers requesting to join an offer)
    CREATE TABLE IF NOT EXISTS join_requests (
      join_id VARCHAR(50) PRIMARY KEY,
      offer_id VARCHAR(50) REFERENCES carpool_offers(offer_id) ON DELETE CASCADE,
      account_id VARCHAR(50) REFERENCES accounts(account_id) ON DELETE CASCADE,
      name VARCHAR(255),
      phone VARCHAR(50),
      passenger_count INTEGER DEFAULT 1,
      pickup_location TEXT,
      notes TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Users table (event participants - drivers and passengers)
    CREATE TABLE IF NOT EXISTS users (
      user_id VARCHAR(50) PRIMARY KEY,
      event_id VARCHAR(50) REFERENCES events(event_id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      email VARCHAR(255),
      role VARCHAR(20) DEFAULT 'passenger',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Offer locations table (multiple pickup/dropoff points for offers)
    CREATE TABLE IF NOT EXISTS offer_locations (
      location_id SERIAL PRIMARY KEY,
      offer_id VARCHAR(50) REFERENCES carpool_offers(offer_id) ON DELETE CASCADE,
      location_address TEXT,
      location_lat DECIMAL(10, 8),
      location_lng DECIMAL(11, 8),
      trip_direction VARCHAR(20),
      time_type VARCHAR(20),
      specific_time TIME,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Request locations table (multiple pickup/dropoff points for requests)
    CREATE TABLE IF NOT EXISTS request_locations (
      location_id SERIAL PRIMARY KEY,
      request_id VARCHAR(50) REFERENCES carpool_requests(request_id) ON DELETE CASCADE,
      location_address TEXT,
      location_lat DECIMAL(10, 8),
      location_lng DECIMAL(11, 8),
      trip_direction VARCHAR(20),
      time_type VARCHAR(20),
      specific_time TIME,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Matches table (connections between offers and requests)
    CREATE TABLE IF NOT EXISTS matches (
      match_id VARCHAR(50) PRIMARY KEY,
      offer_id VARCHAR(50) REFERENCES carpool_offers(offer_id) ON DELETE CASCADE,
      request_id VARCHAR(50) REFERENCES carpool_requests(request_id) ON DELETE CASCADE,
      driver_id VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
      passenger_id VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
      status VARCHAR(20) DEFAULT 'pending',
      initiated_by VARCHAR(20),
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better performance (only for columns that always exist)
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);
    CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);
    CREATE INDEX IF NOT EXISTS idx_events_code ON events(event_code);
    CREATE INDEX IF NOT EXISTS idx_offers_event ON carpool_offers(event_id);
    CREATE INDEX IF NOT EXISTS idx_offers_owner ON carpool_offers(owner_account_id);
    CREATE INDEX IF NOT EXISTS idx_requests_event ON carpool_requests(event_id);
    CREATE INDEX IF NOT EXISTS idx_requests_owner ON carpool_requests(owner_account_id);
    CREATE INDEX IF NOT EXISTS idx_join_requests_offer ON join_requests(offer_id);
    CREATE INDEX IF NOT EXISTS idx_join_requests_account ON join_requests(account_id);
    CREATE INDEX IF NOT EXISTS idx_users_event ON users(event_id);
    CREATE INDEX IF NOT EXISTS idx_offer_locations_offer ON offer_locations(offer_id);
    CREATE INDEX IF NOT EXISTS idx_request_locations_request ON request_locations(request_id);
    CREATE INDEX IF NOT EXISTS idx_matches_offer ON matches(offer_id);
    CREATE INDEX IF NOT EXISTS idx_matches_request ON matches(request_id);
    CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
  `;

  try {
    await pool.query(createTablesSQL);
    console.log('✅ Database tables created/verified');

    // Run migrations to add missing columns to existing tables
    await runMigrations();

    return true;
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    return false;
  }
}

// Run database migrations to add missing columns
async function runMigrations() {
  if (!pool) return;

  const migrations = [
    // Add driver_id to carpool_offers if it doesn't exist
    `ALTER TABLE carpool_offers ADD COLUMN IF NOT EXISTS driver_id VARCHAR(50)`,
    // Add passenger_id to carpool_requests if it doesn't exist
    `ALTER TABLE carpool_requests ADD COLUMN IF NOT EXISTS passenger_id VARCHAR(50)`,
    // Add creator_account_id to events if it doesn't exist
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS creator_account_id VARCHAR(50)`,
    // Create indexes for the new columns (after they exist)
    `CREATE INDEX IF NOT EXISTS idx_offers_driver ON carpool_offers(driver_id)`,
    `CREATE INDEX IF NOT EXISTS idx_requests_passenger ON carpool_requests(passenger_id)`,
    `CREATE INDEX IF NOT EXISTS idx_events_creator ON events(creator_account_id)`,
  ];

  for (const migration of migrations) {
    try {
      await pool.query(migration);
    } catch (error) {
      // Ignore errors - column might already exist or syntax not supported
      if (!error.message.includes('already exists')) {
        console.log('Migration note:', error.message);
      }
    }
  }

  console.log('✅ Database migrations completed');
}

// Generic query helper
async function query(text, params) {
  if (!pool) return null;
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

// ==================
// ACCOUNTS
// ==================

async function createAccount(account) {
  const sql = `
    INSERT INTO accounts (account_id, name, phone, email, gender, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const result = await query(sql, [
    account.account_id,
    account.name,
    account.phone,
    account.email || null,
    account.gender || null,
    account.created_at || new Date(),
    account.updated_at || new Date()
  ]);
  return result?.rows[0];
}

async function findAccountByPhone(phone) {
  const result = await query('SELECT * FROM accounts WHERE phone = $1', [phone]);
  return result?.rows[0];
}

async function findAccountById(accountId) {
  const result = await query('SELECT * FROM accounts WHERE account_id = $1', [accountId]);
  return result?.rows[0];
}

async function updateAccount(accountId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'account_id') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = $${paramIndex}`);
  values.push(new Date());
  values.push(accountId);

  const sql = `UPDATE accounts SET ${fields.join(', ')} WHERE account_id = $${paramIndex + 1} RETURNING *`;
  const result = await query(sql, values);
  return result?.rows[0];
}

async function getAllAccounts() {
  const result = await query('SELECT * FROM accounts ORDER BY created_at DESC');
  return result?.rows || [];
}

// ==================
// SESSIONS
// ==================

async function createSession(session) {
  const sql = `
    INSERT INTO sessions (session_id, account_id, token, created_at, expires_at, last_used)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const result = await query(sql, [
    session.session_id,
    session.account_id,
    session.token,
    session.created_at || new Date(),
    session.expires_at,
    session.last_used || new Date()
  ]);
  return result?.rows[0];
}

async function findSessionByToken(token) {
  const result = await query('SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()', [token]);
  return result?.rows[0];
}

async function updateSessionLastUsed(sessionId) {
  await query('UPDATE sessions SET last_used = NOW() WHERE session_id = $1', [sessionId]);
}

async function deleteSessionsByAccountId(accountId) {
  await query('DELETE FROM sessions WHERE account_id = $1', [accountId]);
}

async function deleteSession(token) {
  await query('DELETE FROM sessions WHERE token = $1', [token]);
}

// ==================
// OTP CODES
// ==================

async function createOTP(otpData) {
  const sql = `
    INSERT INTO otp_codes (phone, otp, created_at, expires_at, verified)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const result = await query(sql, [
    otpData.phone,
    otpData.otp,
    otpData.created_at || new Date(),
    otpData.expires_at,
    false
  ]);
  return result?.rows[0];
}

async function findValidOTP(phone, otp) {
  const result = await query(
    'SELECT * FROM otp_codes WHERE phone = $1 AND otp = $2 AND expires_at > NOW() AND verified = FALSE ORDER BY created_at DESC LIMIT 1',
    [phone, otp]
  );
  return result?.rows[0];
}

async function findRecentOTP(phone) {
  const result = await query(
    'SELECT * FROM otp_codes WHERE phone = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    [phone]
  );
  return result?.rows[0];
}

async function markOTPVerified(id) {
  await query('UPDATE otp_codes SET verified = TRUE WHERE id = $1', [id]);
}

async function cleanupExpiredOTPs() {
  await query('DELETE FROM otp_codes WHERE expires_at < NOW()');
}

// ==================
// EVENTS
// ==================

async function createEvent(event) {
  const sql = `
    INSERT INTO events (event_id, event_code, event_name, event_date, event_time, event_location,
      location_lat, location_lng, event_description, creator_account_id, creator_phone, creator_name,
      access_code, is_private, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `;
  const result = await query(sql, [
    event.event_id,
    event.event_code,
    event.event_name,
    event.event_date,
    event.event_time || null,
    event.event_location || null,
    event.location_lat || null,
    event.location_lng || null,
    event.event_description || null,
    event.creator_account_id || null,
    event.creator_phone || null,
    event.creator_name || null,
    event.access_code || null,
    event.is_private || false,
    event.status || 'active',
    event.created_at || new Date(),
    event.updated_at || new Date()
  ]);
  return result?.rows[0];
}

async function findEventByCode(eventCode) {
  const result = await query('SELECT * FROM events WHERE event_code = $1', [eventCode]);
  return result?.rows[0];
}

async function findEventById(eventId) {
  const result = await query('SELECT * FROM events WHERE event_id = $1', [eventId]);
  return result?.rows[0];
}

async function getAllEvents() {
  const result = await query('SELECT * FROM events ORDER BY created_at DESC');
  return result?.rows || [];
}

async function updateEvent(eventId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'event_id') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = $${paramIndex}`);
  values.push(new Date());
  values.push(eventId);

  const sql = `UPDATE events SET ${fields.join(', ')} WHERE event_id = $${paramIndex + 1} RETURNING *`;
  const result = await query(sql, values);
  return result?.rows[0];
}

async function deleteEvent(eventId) {
  await query('DELETE FROM events WHERE event_id = $1', [eventId]);
}

// ==================
// CARPOOL OFFERS
// ==================

async function createOffer(offer) {
  const sql = `
    INSERT INTO carpool_offers (offer_id, event_id, owner_account_id, name, phone, email, gender,
      pickup_location, pickup_lat, pickup_lng, total_seats, available_seats, departure_time,
      trip_type, notes, preference, payment_required, payment_amount, payment_method, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *
  `;
  const result = await query(sql, [
    offer.offer_id,
    offer.event_id,
    offer.owner_account_id || null,
    offer.name,
    offer.phone,
    offer.email || null,
    offer.gender || null,
    offer.pickup_location || null,
    offer.pickup_lat || null,
    offer.pickup_lng || null,
    offer.total_seats || 1,
    offer.available_seats || offer.total_seats || 1,
    offer.departure_time || null,
    offer.trip_type || 'to_event',
    offer.notes || null,
    offer.preference || null,
    offer.payment_required || 'free',
    offer.payment_amount || null,
    offer.payment_method || null,
    offer.status || 'active',
    offer.created_at || new Date(),
    offer.updated_at || new Date()
  ]);
  return result?.rows[0];
}

async function findOfferById(offerId) {
  const result = await query('SELECT * FROM carpool_offers WHERE offer_id = $1', [offerId]);
  return result?.rows[0];
}

async function findOffersByEventId(eventId) {
  const result = await query('SELECT * FROM carpool_offers WHERE event_id = $1 ORDER BY created_at DESC', [eventId]);
  return result?.rows || [];
}

async function findOffersByAccountId(accountId) {
  const result = await query('SELECT * FROM carpool_offers WHERE owner_account_id = $1 ORDER BY created_at DESC', [accountId]);
  return result?.rows || [];
}

async function getAllOffers() {
  const result = await query('SELECT * FROM carpool_offers ORDER BY created_at DESC');
  return result?.rows || [];
}

async function updateOffer(offerId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'offer_id') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = $${paramIndex}`);
  values.push(new Date());
  values.push(offerId);

  const sql = `UPDATE carpool_offers SET ${fields.join(', ')} WHERE offer_id = $${paramIndex + 1} RETURNING *`;
  const result = await query(sql, values);
  return result?.rows[0];
}

async function deleteOffer(offerId) {
  await query('DELETE FROM carpool_offers WHERE offer_id = $1', [offerId]);
}

// ==================
// CARPOOL REQUESTS
// ==================

async function createRequest(request) {
  const sql = `
    INSERT INTO carpool_requests (request_id, event_id, owner_account_id, name, phone, email, gender,
      pickup_location, pickup_lat, pickup_lng, passenger_count, trip_type, notes, preference, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `;
  const result = await query(sql, [
    request.request_id,
    request.event_id,
    request.owner_account_id || null,
    request.name,
    request.phone,
    request.email || null,
    request.gender || null,
    request.pickup_location || null,
    request.pickup_lat || null,
    request.pickup_lng || null,
    request.passenger_count || 1,
    request.trip_type || 'to_event',
    request.notes || null,
    request.preference || null,
    request.status || 'active',
    request.created_at || new Date(),
    request.updated_at || new Date()
  ]);
  return result?.rows[0];
}

async function findRequestById(requestId) {
  const result = await query('SELECT * FROM carpool_requests WHERE request_id = $1', [requestId]);
  return result?.rows[0];
}

async function findRequestsByEventId(eventId) {
  const result = await query('SELECT * FROM carpool_requests WHERE event_id = $1 ORDER BY created_at DESC', [eventId]);
  return result?.rows || [];
}

async function findRequestsByAccountId(accountId) {
  const result = await query('SELECT * FROM carpool_requests WHERE owner_account_id = $1 ORDER BY created_at DESC', [accountId]);
  return result?.rows || [];
}

async function getAllRequests() {
  const result = await query('SELECT * FROM carpool_requests ORDER BY created_at DESC');
  return result?.rows || [];
}

async function updateRequest(requestId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'request_id') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = $${paramIndex}`);
  values.push(new Date());
  values.push(requestId);

  const sql = `UPDATE carpool_requests SET ${fields.join(', ')} WHERE request_id = $${paramIndex + 1} RETURNING *`;
  const result = await query(sql, values);
  return result?.rows[0];
}

async function deleteRequest(requestId) {
  await query('DELETE FROM carpool_requests WHERE request_id = $1', [requestId]);
}

// ==================
// JOIN REQUESTS
// ==================

async function createJoinRequest(joinRequest) {
  const sql = `
    INSERT INTO join_requests (join_id, offer_id, account_id, name, phone, passenger_count, pickup_location, notes, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  const result = await query(sql, [
    joinRequest.join_id,
    joinRequest.offer_id,
    joinRequest.account_id || null,
    joinRequest.name,
    joinRequest.phone,
    joinRequest.passenger_count || 1,
    joinRequest.pickup_location || null,
    joinRequest.notes || null,
    joinRequest.status || 'pending',
    joinRequest.created_at || new Date(),
    joinRequest.updated_at || new Date()
  ]);
  return result?.rows[0];
}

async function findJoinRequestById(joinId) {
  const result = await query('SELECT * FROM join_requests WHERE join_id = $1', [joinId]);
  return result?.rows[0];
}

async function findJoinRequestsByOfferId(offerId) {
  const result = await query('SELECT * FROM join_requests WHERE offer_id = $1 ORDER BY created_at DESC', [offerId]);
  return result?.rows || [];
}

async function findJoinRequestsByAccountId(accountId) {
  const result = await query('SELECT * FROM join_requests WHERE account_id = $1 ORDER BY created_at DESC', [accountId]);
  return result?.rows || [];
}

async function getAllJoinRequests() {
  const result = await query('SELECT * FROM join_requests ORDER BY created_at DESC');
  return result?.rows || [];
}

async function updateJoinRequest(joinId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'join_id') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = $${paramIndex}`);
  values.push(new Date());
  values.push(joinId);

  const sql = `UPDATE join_requests SET ${fields.join(', ')} WHERE join_id = $${paramIndex + 1} RETURNING *`;
  const result = await query(sql, values);
  return result?.rows[0];
}

async function deleteJoinRequest(joinId) {
  await query('DELETE FROM join_requests WHERE join_id = $1', [joinId]);
}

// ==================
// UTILITY FUNCTIONS
// ==================

async function getStats() {
  if (!pool) return null;
  
  try {
    const [accounts, events, offers, requests, joinRequests] = await Promise.all([
      query('SELECT COUNT(*) as count FROM accounts'),
      query('SELECT COUNT(*) as count FROM events'),
      query('SELECT COUNT(*) as count FROM carpool_offers'),
      query('SELECT COUNT(*) as count FROM carpool_requests'),
      query('SELECT COUNT(*) as count FROM join_requests')
    ]);

    return {
      accounts: parseInt(accounts.rows[0].count),
      events: parseInt(events.rows[0].count),
      offers: parseInt(offers.rows[0].count),
      requests: parseInt(requests.rows[0].count),
      joinRequests: parseInt(joinRequests.rows[0].count)
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return null;
  }
}

function isConnected() {
  return pool !== null;
}

function getPool() {
  return pool;
}

async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection closed');
  }
}

module.exports = {
  initDatabase,
  createTables,
  query,
  isConnected,
  getPool,
  closeConnection,
  getStats,
  
  // Accounts
  createAccount,
  findAccountByPhone,
  findAccountById,
  updateAccount,
  getAllAccounts,
  
  // Sessions
  createSession,
  findSessionByToken,
  updateSessionLastUsed,
  deleteSessionsByAccountId,
  deleteSession,
  
  // OTP
  createOTP,
  findValidOTP,
  findRecentOTP,
  markOTPVerified,
  cleanupExpiredOTPs,
  
  // Events
  createEvent,
  findEventByCode,
  findEventById,
  getAllEvents,
  updateEvent,
  deleteEvent,
  
  // Offers
  createOffer,
  findOfferById,
  findOffersByEventId,
  findOffersByAccountId,
  getAllOffers,
  updateOffer,
  deleteOffer,
  
  // Requests
  createRequest,
  findRequestById,
  findRequestsByEventId,
  findRequestsByAccountId,
  getAllRequests,
  updateRequest,
  deleteRequest,
  
  // Join Requests
  createJoinRequest,
  findJoinRequestById,
  findJoinRequestsByOfferId,
  findJoinRequestsByAccountId,
  getAllJoinRequests,
  updateJoinRequest,
  deleteJoinRequest
};

