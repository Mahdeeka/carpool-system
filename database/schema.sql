-- Carpool System Database Schema
-- PostgreSQL 12+

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================
-- ACCOUNTS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS accounts (
    account_id VARCHAR(100) PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounts_phone ON accounts(phone);
CREATE INDEX idx_accounts_email ON accounts(email);

-- =======================
-- OTP CODES TABLE
-- =======================
CREATE TABLE IF NOT EXISTS otp_codes (
    id VARCHAR(100) PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_otp_phone ON otp_codes(phone);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);

-- =======================
-- SESSIONS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    account_id VARCHAR(100) NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_account ON sessions(account_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- =======================
-- EVENTS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS events (
    event_id VARCHAR(100) PRIMARY KEY,
    event_code VARCHAR(20) UNIQUE NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE,
    event_time VARCHAR(10),
    event_location TEXT,
    event_lat DECIMAL(10, 8),
    event_lng DECIMAL(11, 8),
    is_private BOOLEAN DEFAULT FALSE,
    access_code VARCHAR(50),
    creator_account_id VARCHAR(100) REFERENCES accounts(account_id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_code ON events(event_code);
CREATE INDEX idx_events_creator ON events(creator_account_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(event_date);

-- =======================
-- EVENT PARTICIPANTS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS event_participants (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    account_id VARCHAR(100) NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('creator', 'participant', 'driver', 'passenger')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, account_id)
);

CREATE INDEX idx_event_participants_event ON event_participants(event_id);
CREATE INDEX idx_event_participants_account ON event_participants(account_id);

-- =======================
-- USERS TABLE (Legacy - for backward compatibility)
-- =======================
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(100) PRIMARY KEY,
    event_id VARCHAR(100) REFERENCES events(event_id) ON DELETE CASCADE,
    account_id VARCHAR(100) REFERENCES accounts(account_id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    role VARCHAR(20) CHECK (role IN ('driver', 'passenger')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_event ON users(event_id);
CREATE INDEX idx_users_account ON users(account_id);

-- =======================
-- CARPOOL OFFERS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS carpool_offers (
    offer_id VARCHAR(100) PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    driver_id VARCHAR(100) REFERENCES users(user_id),
    account_id VARCHAR(100) REFERENCES accounts(account_id),
    name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    total_seats INTEGER NOT NULL DEFAULT 4 CHECK (total_seats > 0),
    available_seats INTEGER NOT NULL DEFAULT 4 CHECK (available_seats >= 0),
    description TEXT,
    trip_type VARCHAR(20) DEFAULT 'both' CHECK (trip_type IN ('going', 'return', 'both')),
    preference VARCHAR(20) DEFAULT 'any' CHECK (preference IN ('any', 'male', 'female')),
    privacy VARCHAR(20) DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
    hide_name BOOLEAN DEFAULT FALSE,
    hide_phone BOOLEAN DEFAULT FALSE,
    hide_email BOOLEAN DEFAULT FALSE,
    payment_required VARCHAR(20) DEFAULT 'not_required' CHECK (payment_required IN ('not_required', 'optional', 'required')),
    payment_amount DECIMAL(10, 2),
    payment_method VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_offers_event ON carpool_offers(event_id);
CREATE INDEX idx_offers_driver ON carpool_offers(driver_id);
CREATE INDEX idx_offers_account ON carpool_offers(account_id);
CREATE INDEX idx_offers_status ON carpool_offers(status);
CREATE INDEX idx_offers_privacy ON carpool_offers(privacy);

-- =======================
-- OFFER LOCATIONS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS offer_locations (
    location_id SERIAL PRIMARY KEY,
    offer_id VARCHAR(100) NOT NULL REFERENCES carpool_offers(offer_id) ON DELETE CASCADE,
    location_address TEXT NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    trip_direction VARCHAR(20) CHECK (trip_direction IN ('going', 'return')),
    time_type VARCHAR(20) DEFAULT 'flexible' CHECK (time_type IN ('flexible', 'specific')),
    specific_time TIMESTAMP WITH TIME ZONE,
    sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_offer_locations_offer ON offer_locations(offer_id);

-- =======================
-- CARPOOL REQUESTS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS carpool_requests (
    request_id VARCHAR(100) PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    passenger_id VARCHAR(100) REFERENCES users(user_id),
    account_id VARCHAR(100) REFERENCES accounts(account_id),
    name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    trip_type VARCHAR(20) DEFAULT 'both' CHECK (trip_type IN ('going', 'return', 'both')),
    preference VARCHAR(20) DEFAULT 'any' CHECK (preference IN ('any', 'male', 'female')),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    hide_name BOOLEAN DEFAULT FALSE,
    hide_phone BOOLEAN DEFAULT FALSE,
    hide_email BOOLEAN DEFAULT FALSE,
    passenger_count INTEGER DEFAULT 1 CHECK (passenger_count > 0),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'matched', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_requests_event ON carpool_requests(event_id);
CREATE INDEX idx_requests_passenger ON carpool_requests(passenger_id);
CREATE INDEX idx_requests_account ON carpool_requests(account_id);
CREATE INDEX idx_requests_status ON carpool_requests(status);

-- =======================
-- REQUEST LOCATIONS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS request_locations (
    location_id SERIAL PRIMARY KEY,
    request_id VARCHAR(100) NOT NULL REFERENCES carpool_requests(request_id) ON DELETE CASCADE,
    location_address TEXT NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    trip_direction VARCHAR(20) CHECK (trip_direction IN ('going', 'return')),
    time_type VARCHAR(20) DEFAULT 'flexible' CHECK (time_type IN ('flexible', 'specific')),
    specific_time TIMESTAMP WITH TIME ZONE,
    sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_request_locations_request ON request_locations(request_id);

-- =======================
-- MATCHES TABLE
-- =======================
CREATE TABLE IF NOT EXISTS matches (
    match_id VARCHAR(100) PRIMARY KEY,
    offer_id VARCHAR(100) NOT NULL REFERENCES carpool_offers(offer_id) ON DELETE CASCADE,
    request_id VARCHAR(100) NOT NULL REFERENCES carpool_requests(request_id) ON DELETE CASCADE,
    driver_id VARCHAR(100) REFERENCES users(user_id),
    passenger_id VARCHAR(100) REFERENCES users(user_id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
    initiated_by VARCHAR(20) CHECK (initiated_by IN ('driver', 'passenger', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_matches_offer ON matches(offer_id);
CREATE INDEX idx_matches_request ON matches(request_id);
CREATE INDEX idx_matches_status ON matches(status);

-- =======================
-- JOIN REQUESTS TABLE
-- =======================
CREATE TABLE IF NOT EXISTS join_requests (
    id VARCHAR(100) PRIMARY KEY,
    offer_id VARCHAR(100) NOT NULL REFERENCES carpool_offers(offer_id) ON DELETE CASCADE,
    account_id VARCHAR(100) REFERENCES accounts(account_id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    pickup_location TEXT,
    pickup_lat DECIMAL(10, 8),
    pickup_lng DECIMAL(11, 8),
    message TEXT,
    passenger_count INTEGER DEFAULT 1 CHECK (passenger_count > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_message TEXT
);

CREATE INDEX idx_join_requests_offer ON join_requests(offer_id);
CREATE INDEX idx_join_requests_account ON join_requests(account_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);
CREATE INDEX idx_join_requests_phone ON join_requests(phone);

-- =======================
-- HELPER FUNCTIONS
-- =======================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carpool_offers_updated_at BEFORE UPDATE ON carpool_offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carpool_requests_updated_at BEFORE UPDATE ON carpool_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- CLEANUP FUNCTIONS
-- =======================

-- Function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_codes WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- VIEWS
-- =======================

-- View for event statistics
CREATE OR REPLACE VIEW event_stats AS
SELECT
    e.event_id,
    e.event_code,
    e.event_name,
    COUNT(DISTINCT o.offer_id) as total_drivers,
    COALESCE(SUM(o.total_seats), 0) as total_seats,
    COALESCE(SUM(o.available_seats), 0) as available_seats,
    COUNT(DISTINCT r.request_id) as total_passengers,
    COUNT(DISTINCT CASE WHEN m.status = 'confirmed' THEN m.match_id END) as confirmed_matches
FROM events e
LEFT JOIN carpool_offers o ON e.event_id = o.event_id AND o.status = 'active'
LEFT JOIN carpool_requests r ON e.event_id = r.event_id AND r.status = 'active'
LEFT JOIN matches m ON o.offer_id = m.offer_id
WHERE e.status = 'active'
GROUP BY e.event_id, e.event_code, e.event_name;

-- =======================
-- SAMPLE DATA (for development)
-- =======================

-- To insert sample data, uncomment and run:
-- INSERT INTO accounts (account_id, phone, email, name, gender)
-- VALUES ('account_sample_1', '+972501234567', 'sample@example.com', 'Sample User', 'male');
