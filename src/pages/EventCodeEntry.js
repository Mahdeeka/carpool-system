import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { validateEventCode } from '../services/api';

function EventCodeEntry() {
  const [eventCode, setEventCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setEventData, showToast, authData, isAuthenticated } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!eventCode.trim()) {
      setError('Please enter an event code');
      return;
    }

    setLoading(true);

    try {
      const response = await validateEventCode(eventCode.trim());
      
      if (response.valid) {
        setEventData({
          eventId: response.event_id,
          eventName: response.event_name,
          eventCode: eventCode.trim(),
        });
        showToast('Event found!', 'success');
        navigate(`/event/${eventCode.trim()}`);
      } else {
        setError('Invalid event code. Please try again.');
      }
    } catch (err) {
      setError('Invalid event code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-code-page">
      {/* User Menu - Top Right */}
      <div className="user-menu-container">
        {isAuthenticated ? (
          <div className="user-menu">
            <button
              className="user-menu-btn"
              onClick={() => navigate('/my-account')}
            >
              <span className="user-avatar-small">
                {authData?.name?.charAt(0)?.toUpperCase()}
              </span>
              <span className="user-menu-name">{authData?.name?.split(' ')[0]}</span>
            </button>
          </div>
        ) : (
          <button
            className="btn btn-outline login-header-btn"
            onClick={() => navigate('/login')}
          >
            Login / Sign Up
          </button>
        )}
      </div>
      
      <div className="event-code-card">
        <div className="event-code-logo">🚗</div>
        <h1 className="event-code-title">Carpool</h1>
        <p className="event-code-subtitle">
          Share rides to events with friends and colleagues
        </p>
        
        {/* Welcome back message for logged in users */}
        {isAuthenticated && (
          <div className="welcome-banner">
            <div className="welcome-banner-content">
              <p className="welcome-banner-title">
                👋 Welcome, {authData?.name?.split(' ')[0]}!
              </p>
              <p className="welcome-banner-subtitle">
                Logged in
              </p>
            </div>
            <button
              className="welcome-banner-btn"
              onClick={() => navigate('/my-account')}
            >
              My Account →
            </button>
          </div>
        )}

        {/* Create Event - Primary Action */}
        <div className="create-event-section">
          <button 
            onClick={() => navigate('/create-event')}
            className="btn btn-primary btn-block btn-lg create-event-btn"
          >
            ✨ Create New Event
          </button>
          <p className="create-event-hint">
            Organizing an event? Create a carpool link to share
          </p>
        </div>

        <div className="divider">
          <span>or join an existing event</span>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="Enter event code (e.g., ABC123)"
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value.toUpperCase())}
              disabled={loading}
              style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '2px' }}
            />
            {error && <div className="form-error" style={{ justifyContent: 'center' }}>⚠️ {error}</div>}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-outline btn-block btn-lg"
            disabled={loading}
          >
            {loading ? 'Finding event...' : 'Join Event →'}
          </button>
        </form>
        
        {/* Login prompt for non-logged in users */}
        {!isAuthenticated && (
          <div className="login-prompt-section">
            <p className="login-prompt-text">
              Create an account to manage your rides across devices
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-secondary"
            >
              📱 Login with Phone
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventCodeEntry;
