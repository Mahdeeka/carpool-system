import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { API_BASE_URL } from '../services/api';
import MapLocationPicker from '../components/MapLocationPicker';

function CreateEvent() {
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    eventLat: null,
    eventLng: null,
    isPrivate: false,
    accessCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdEvent, setCreatedEvent] = useState(null);
  const navigate = useNavigate();
  const { showToast, isAuthenticated, authData, authLoading } = useApp();

  // Redirect to login if not authenticated  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Show toast first
      showToast('Please login to create an event', 'info');
      // Small delay for better UX
      const timer = setTimeout(() => {
        navigate('/login', { state: { returnTo: '/create-event' } });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authLoading, navigate, showToast]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.eventName || !formData.eventDate || !formData.eventTime || !formData.eventLocation) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.isPrivate && !formData.accessCode) {
      setError('Please set an access code for your private event');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Please login to create an event');
        showToast('Please login to create an event', 'error');
        navigate('/login', { state: { returnTo: '/create-event' } });
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/event`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again.');
          showToast('Session expired. Please login again.', 'error');
          navigate('/login', { state: { returnTo: '/create-event' } });
          return;
        }
        setError(data.message || 'Failed to create event');
        return;
      }
      
      if (data.success) {
        const fullLink = `${window.location.origin}/event/${data.event_code}`;
        setCreatedEvent({
          ...data,
          fullLink,
          eventName: formData.eventName,
          eventDate: formData.eventDate,
          eventTime: formData.eventTime,
          eventLocation: formData.eventLocation,
          isPrivate: formData.isPrivate,
          accessCode: formData.accessCode,
        });
        showToast('Event created successfully!', 'success');
      } else {
        setError(data.message || 'Failed to create event');
      }
    } catch (err) {
      setError('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(createdEvent.fullLink);
    showToast('Link copied to clipboard!', 'success');
  };

  const goToEvent = () => {
    navigate(`/event/${createdEvent.event_code}`);
  };

  const goToAdminDashboard = () => {
    navigate(`/event/${createdEvent.event_code}/admin`);
  };

  // Show loading while checking auth or redirecting
  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="page-loading-overlay">
        <div className="simple-car-loader">
          <div className="simple-car">
            <div className="simple-car-body"></div>
            <div className="simple-car-top"></div>
            <div className="simple-car-window"></div>
            <div className="simple-car-light-front"></div>
            <div className="simple-car-light-back"></div>
            <div className="simple-car-wheel simple-car-wheel-front"></div>
            <div className="simple-car-wheel simple-car-wheel-back"></div>
            <div className="speed-lines">
              <div className="speed-line"></div>
              <div className="speed-line"></div>
              <div className="speed-line"></div>
            </div>
            <div className="exhaust">
              <div className="exhaust-puff"></div>
              <div className="exhaust-puff"></div>
              <div className="exhaust-puff"></div>
            </div>
          </div>
          <div className="simple-road"></div>
        </div>
        <p className="loading-text">{!isAuthenticated ? 'Redirecting to login...' : 'Loading...'}</p>
      </div>
    );
  }

  // Success screen after event creation
  if (createdEvent) {
    return (
      <div className="create-event-page">
        <div className="create-event-card success-card">
          <div className="success-icon">🎉</div>
          <h1 className="success-title">Event Created!</h1>
          <p className="success-subtitle">Share this link with your attendees</p>
          
          <div className="event-summary">
            <div className="summary-item">
              <span className="summary-label">📅 Event</span>
              <span className="summary-value">{createdEvent.eventName}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">🕐 When</span>
              <span className="summary-value">
                {new Date(createdEvent.eventDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} at {createdEvent.eventTime}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">📍 Where</span>
              <span className="summary-value">{createdEvent.eventLocation}</span>
            </div>
            {createdEvent.isPrivate && (
              <div className="summary-item">
                <span className="summary-label">🔒 Access Code</span>
                <span className="summary-value access-code">{createdEvent.accessCode}</span>
              </div>
            )}
          </div>

          <div className="share-link-box">
            <label className="share-label">🔗 Share this link:</label>
            <div className="share-link-input">
              <input 
                type="text" 
                value={createdEvent.fullLink} 
                readOnly 
                className="form-input"
              />
              <button onClick={copyLink} className="btn btn-primary copy-btn">
                📋 Copy
              </button>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={goToAdminDashboard} className="btn btn-primary btn-lg btn-block">
              ⚙️ Manage Event (Admin Dashboard)
            </button>
            <button onClick={goToEvent} className="btn btn-success btn-lg btn-block" style={{ marginTop: '12px' }}>
              🚗 Go to Event Page →
            </button>
            <button 
              onClick={() => setCreatedEvent(null)} 
              className="btn btn-ghost btn-block"
              style={{ marginTop: '12px' }}
            >
              Create Another Event
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-event-page">
      <div className="create-event-card">
        <div className="create-event-header">
          <div className="create-event-logo">🚗</div>
          <h1 className="create-event-title">Create Carpool Event</h1>
          <p className="create-event-subtitle">
            Set up a carpool for your event and share the link with attendees
          </p>
          
          {/* Show logged in user */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            border: '1px solid #86efac',
            borderRadius: '8px',
            padding: '12px 16px',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#10b981',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600
            }}>
              {authData?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#065f46', fontSize: '14px' }}>
                Creating as {authData?.name}
              </div>
              <div style={{ fontSize: '12px', color: '#047857' }}>
                You'll be the admin of this event
              </div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Event Name *</label>
            <input
              type="text"
              name="eventName"
              className="form-input"
              value={formData.eventName}
              onChange={handleInputChange}
              placeholder="e.g., Sarah's Birthday Party"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                name="eventDate"
                className="form-input"
                value={formData.eventDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Time to be there *</label>
              <input
                type="time"
                name="eventTime"
                className="form-input"
                value={formData.eventTime}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Event Location *</label>
            <MapLocationPicker
              value={formData.eventLocation}
              onChange={(value) => setFormData(prev => ({ ...prev, eventLocation: value }))}
              onLocationSelect={(loc) => setFormData(prev => ({ 
                ...prev, 
                eventLocation: loc.address,
                eventLat: loc.lat,
                eventLng: loc.lng
              }))}
              placeholder="Search for event location..."
            />
          </div>

          <div className="privacy-section">
            <label className="privacy-toggle">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleInputChange}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">
                <strong>{formData.isPrivate ? '🔒 Private Event' : '🌐 Public Event'}</strong>
                <small>
                  {formData.isPrivate 
                    ? 'Only people with the access code can join' 
                    : 'Anyone with the link can join'}
                </small>
              </span>
            </label>
          </div>

          {formData.isPrivate && (
            <div className="form-group access-code-group">
              <label className="form-label">Access Code *</label>
              <input
                type="text"
                name="accessCode"
                className="form-input"
                value={formData.accessCode}
                onChange={handleInputChange}
                placeholder="e.g., party2024"
                maxLength={20}
                style={{ textTransform: 'uppercase' }}
              />
              <small className="form-hint">
                Share this code with your invited guests
              </small>
            </div>
          )}

          {error && <div className="form-error" style={{ marginBottom: '16px', justifyContent: 'center' }}>⚠️ {error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-car-loading">
                <span className="mini-car">🚗</span>
                Creating...
              </span>
            ) : '✨ Create Event & Get Link'}
          </button>
        </form>

        {/* Full screen car animation while creating */}
        {loading && (
          <div className="page-loading-overlay">
            <div className="simple-car-loader">
              <div className="simple-car">
                <div className="simple-car-body"></div>
                <div className="simple-car-top"></div>
                <div className="simple-car-window"></div>
                <div className="simple-car-light-front"></div>
                <div className="simple-car-light-back"></div>
                <div className="simple-car-wheel simple-car-wheel-front"></div>
                <div className="simple-car-wheel simple-car-wheel-back"></div>
                <div className="speed-lines">
                  <div className="speed-line"></div>
                  <div className="speed-line"></div>
                  <div className="speed-line"></div>
                </div>
                <div className="exhaust">
                  <div className="exhaust-puff"></div>
                  <div className="exhaust-puff"></div>
                  <div className="exhaust-puff"></div>
                </div>
              </div>
              <div className="simple-road"></div>
            </div>
            <p className="loading-text">Creating your event...</p>
          </div>
        )}

        <div className="back-link">
          <a href="/">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}

export default CreateEvent;
