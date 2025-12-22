import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { API_BASE_URL } from '../services/api';

function EventPage() {
  const { eventCode } = useParams();
  const navigate = useNavigate();
  const { setEventData, showToast, isAuthenticated, authData } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [needsCode, setNeedsCode] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventCode]);

  const fetchEvent = async (code = null) => {
    setLoading(true);
    setError('');
    
    try {
      const url = code 
        ? `${API_BASE_URL}/event/${eventCode}?access_code=${encodeURIComponent(code)}`
        : `${API_BASE_URL}/event/${eventCode}`;
        
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        setError('Event not found');
        setLoading(false);
        return;
      }
      
      if (data.needs_code) {
        setNeedsCode(true);
        setEvent({ event_name: data.event_name, event_id: data.event_id });
      } else {
        setEvent(data);
        setNeedsCode(false);
      }
    } catch (err) {
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCodeSubmit = (e) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setError('Please enter the access code');
      return;
    }
    fetchEvent(accessCode.trim());
  };

  const joinEvent = async () => {
    if (!acceptedTerms) {
      showToast('Please accept the terms of use to continue', 'error');
      return;
    }
    
    // If not authenticated, redirect to login with return URL
    if (!isAuthenticated) {
      setEventData({
        eventId: event.event_id,
        eventName: event.event_name,
        eventCode: eventCode,
        eventLocation: event.event_location,
        eventDate: event.event_date,
        eventTime: event.event_time,
      });
      navigate('/login', { state: { returnTo: `/event/${eventCode}` } });
      return;
    }
    
    // Register user joining this event
    const success = await registerEventJoin();
    
    setEventData({
      eventId: event.event_id,
      eventName: event.event_name,
      eventCode: eventCode,
      eventLocation: event.event_location,
      eventDate: event.event_date,
      eventTime: event.event_time,
    });
    
    if (success) {
      showToast(`Successfully joined ${event.event_name}!`, 'success');
    } else {
      showToast(`Welcome to ${event.event_name}!`, 'success');
    }
    navigate(`/event/${eventCode}`);
  };
  
  const registerEventJoin = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/event/${event.event_id}/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      const data = await response.json();
      return data.success;
    } catch (err) {
      console.error('Failed to register event join:', err);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="event-code-page">
        <div className="event-code-card">
          <div className="car-animation">
            <div className="car-loader">
              <div className="car-body">
                <div className="car-top"></div>
                <div className="car-bottom"></div>
                <div className="car-window"></div>
                <div className="car-light"></div>
                <div className="car-wheel car-wheel-front"></div>
                <div className="car-wheel car-wheel-back"></div>
              </div>
              <div className="car-road"></div>
            </div>
          </div>
          <p style={{ textAlign: 'center', marginTop: '16px', color: '#6b7280' }}>
            Loading event...
          </p>
        </div>
      </div>
    );
  }

  if (error && !needsCode) {
    return (
      <div className="event-code-page">
        <div className="event-code-card">
          <div className="event-code-logo">😕</div>
          <h1 className="event-code-title">Event Not Found</h1>
          <p className="event-code-subtitle">
            This event doesn't exist or has been removed.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: '24px' }}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Private event - needs access code
  if (needsCode) {
    return (
      <div className="event-code-page">
        <div className="event-code-card">
          <div className="event-code-logo">🔒</div>
          <h1 className="event-code-title">Private Event</h1>
          <p className="event-code-subtitle">
            <strong>{event?.event_name}</strong>
            <br />
            Enter the access code to join this event
          </p>
          
          <form onSubmit={handleAccessCodeSubmit}>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Enter access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                autoFocus
              />
              {error && <div className="form-error">{error}</div>}
            </div>
            
            <button type="submit" className="btn btn-primary btn-block btn-lg">
              Unlock Event
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <a href="/" style={{ color: '#6b7280', fontSize: '14px', textDecoration: 'none' }}>
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Event found - show details and join button
  return (
    <div className="event-code-page">
      <div className="event-code-card event-details-card">
        <div className="event-code-logo">🚗</div>
        <h1 className="event-code-title">{event.event_name}</h1>
        
        <div className="event-details">
          <div className="event-detail-item">
            <span className="detail-icon">📅</span>
            <span className="detail-text">
              {new Date(event.event_date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          
          <div className="event-detail-item">
            <span className="detail-icon">🕐</span>
            <span className="detail-text">{event.event_time}</span>
          </div>
          
          <div className="event-detail-item">
            <span className="detail-icon">📍</span>
            <span className="detail-text">{event.event_location}</span>
          </div>
        </div>

        <div className="join-section">
          <p className="join-text">Ready to find or offer a ride?</p>
          
          {/* Terms of Use Checkbox */}
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px 16px', 
            background: '#f8fafc', 
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#334155'
            }}>
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{ marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0369a1',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit'
                  }}
                >
                  Terms of Use
                </button>
                {' '}and consent to receive updates about this event via SMS and email.
              </span>
            </label>
          </div>
          
          {isAuthenticated ? (
            <div style={{ marginBottom: '12px', textAlign: 'center' }}>
              <span style={{ fontSize: '14px', color: '#059669' }}>
                ✅ Logged in as <strong>{authData?.name}</strong>
              </span>
            </div>
          ) : (
            <div style={{ 
              marginBottom: '12px', 
              padding: '10px', 
              background: '#fef3c7', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '13px', color: '#92400e' }}>
                📱 You'll need to login/signup to join this event
              </span>
            </div>
          )}
          
          <button 
            onClick={joinEvent}
            className="btn btn-primary btn-block btn-lg"
            disabled={!acceptedTerms}
            style={{ opacity: acceptedTerms ? 1 : 0.6 }}
          >
            {isAuthenticated ? 'Join Event →' : 'Login & Join Event →'}
          </button>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <a href="/" style={{ color: '#6b7280', fontSize: '14px', textDecoration: 'none' }}>
            ← Back to Home
          </a>
        </div>
      </div>
      
      {/* Terms of Use Modal */}
      {showTermsModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowTermsModal(false)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '24px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: '20px', color: '#1e293b' }}>
              📜 Terms of Use
            </h2>
            
            <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>
              <h3 style={{ fontSize: '16px', margin: '16px 0 8px' }}>1. Service Description</h3>
              <p>
                This carpool coordination service connects drivers and passengers for shared transportation to events.
                The service facilitates introductions but does not operate transportation services.
              </p>
              
              <h3 style={{ fontSize: '16px', margin: '16px 0 8px' }}>2. User Responsibilities</h3>
              <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                <li>Provide accurate contact information</li>
                <li>Communicate respectfully with other users</li>
                <li>Honor commitments made through the platform</li>
                <li>Notify promptly of any changes to plans</li>
              </ul>
              
              <h3 style={{ fontSize: '16px', margin: '16px 0 8px' }}>3. Privacy & Communications</h3>
              <p>
                By joining an event, you consent to:
              </p>
              <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                <li>Receiving SMS notifications about ride coordination</li>
                <li>Receiving email updates about the event</li>
                <li>Sharing your contact details with matched drivers/passengers</li>
              </ul>
              
              <h3 style={{ fontSize: '16px', margin: '16px 0 8px' }}>4. Liability</h3>
              <p>
                Users participate in carpools at their own risk. The platform facilitates connections but is not 
                responsible for the actions of drivers or passengers, vehicle conditions, or any incidents during travel.
              </p>
              
              <h3 style={{ fontSize: '16px', margin: '16px 0 8px' }}>5. Data Usage</h3>
              <p>
                Your data will be used solely for event coordination purposes and will not be shared with third parties 
                for marketing purposes.
              </p>
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowTermsModal(false);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0369a1',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                Accept Terms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventPage;

