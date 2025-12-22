import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import MapLocationPicker from '../components/MapLocationPicker';
import './EventAdminDashboard.css';

import { API_BASE_URL as API_URL } from '../services/api';

function EventAdminDashboard() {
  const { eventCode } = useParams();
  const navigate = useNavigate();
  const { showToast, isAuthenticated, authLoading } = useApp();

  const [event, setEvent] = useState(null);
  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchEventData = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/event/${eventCode}/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError('You are not authorized to manage this event');
        } else if (response.status === 404) {
          setError('Event not found');
        } else {
          setError('Failed to load event data');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setEvent(data.event);
      setOffers(data.offers || []);
      setRequests(data.requests || []);
      setStats(data.stats);
      setEditForm({
        eventName: data.event.event_name,
        eventDate: data.event.event_date,
        eventTime: data.event.event_time,
        eventLocation: data.event.event_location,
        eventLat: data.event.event_lat || null,
        eventLng: data.event.event_lng || null,
        isPrivate: data.event.is_private,
        accessCode: data.event.access_code || ''
      });
      setLoading(false);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event data');
      setLoading(false);
    }
  }, [eventCode]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        showToast('Please login to access admin dashboard', 'info');
        navigate('/login', { state: { returnTo: `/event/${eventCode}/admin` } });
      } else {
        fetchEventData();
      }
    }
  }, [authLoading, isAuthenticated, fetchEventData, navigate, showToast, eventCode]);

  const handleSaveEvent = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/event/${eventCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        showToast('Event updated successfully', 'success');
        fetchEventData();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to update event', 'error');
      }
    } catch (err) {
      showToast('Failed to update event', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/event/${eventCode}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('Event deleted successfully', 'success');
        navigate('/my-account');
      } else {
        showToast('Failed to delete event', 'error');
      }
    } catch (err) {
      showToast('Failed to delete event', 'error');
    }
  };

  const handleRemoveOffer = async (offerId) => {
    if (!window.confirm('Remove this driver from the event?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/event/${eventCode}/offer/${offerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('Driver removed', 'success');
        fetchEventData();
      } else {
        showToast('Failed to remove driver', 'error');
      }
    } catch (err) {
      showToast('Failed to remove driver', 'error');
    }
  };

  const handleRemoveRequest = async (requestId) => {
    if (!window.confirm('Remove this passenger request?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/event/${eventCode}/request/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('Request removed', 'success');
        fetchEventData();
      } else {
        showToast('Failed to remove request', 'error');
      }
    } catch (err) {
      showToast('Failed to remove request', 'error');
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/event/${eventCode}`;
    navigator.clipboard.writeText(link);
    showToast('Link copied!', 'success');
  };

  if (authLoading || loading) {
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
        <p className="loading-text">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-page">
        <div className="error-container">
          <div className="error-icon">🚫</div>
          <h2>Access Denied</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <button onClick={() => navigate(-1)} className="back-btn">
            ← Back
          </button>
          <div className="event-title">
            <h1>⚙️ {event?.event_name}</h1>
            <span className="admin-badge">Admin Dashboard</span>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={copyLink} className="btn btn-outline">
            🔗 Copy Link
          </button>
          <button onClick={() => navigate(`/event/${eventCode}`)} className="btn btn-primary">
            👁️ View Event
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🚗</div>
            <div className="stat-value">{stats.total_drivers}</div>
            <div className="stat-label">Drivers</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🪑</div>
            <div className="stat-value">{stats.total_seats}</div>
            <div className="stat-label">Total Seats</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.confirmed_passengers}</div>
            <div className="stat-label">Confirmed</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-value">{stats.pending_requests}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => setActiveTab('drivers')}
        >
          🚗 Drivers ({offers.filter(o => o.status === 'active').length})
        </button>
        <button 
          className={`tab ${activeTab === 'passengers' ? 'active' : ''}`}
          onClick={() => setActiveTab('passengers')}
        >
          🙋 Passengers ({requests.filter(r => r.status === 'active').length})
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="admin-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="event-details-card">
              <h3>📅 Event Details</h3>
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{event?.event_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {event?.event_date && new Date(event.event_date).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Time:</span>
                <span className="detail-value">{event?.event_time}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Location:</span>
                <span className="detail-value">{event?.event_location}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Privacy:</span>
                <span className="detail-value">
                  {event?.is_private ? '🔒 Private' : '🌐 Public'}
                  {event?.is_private && event?.access_code && (
                    <span className="access-code-display"> (Code: {event.access_code})</span>
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Event Link:</span>
                <span className="detail-value link-value">
                  {window.location.origin}/event/{eventCode}
                  <button onClick={copyLink} className="copy-inline-btn">📋</button>
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>⚡ Quick Actions</h3>
              <div className="actions-grid">
                <button onClick={() => setActiveTab('settings')} className="action-btn">
                  ✏️ Edit Event
                </button>
                <button onClick={() => navigate(`/event/${eventCode}`)} className="action-btn">
                  👁️ View Public Page
                </button>
                <button onClick={copyLink} className="action-btn">
                  🔗 Share Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drivers Tab */}
        {activeTab === 'drivers' && (
          <div className="drivers-tab">
            {offers.filter(o => o.status === 'active').length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🚗</div>
                <h3>No drivers yet</h3>
                <p>Drivers will appear here when they offer rides.</p>
              </div>
            ) : (
              <div className="items-list">
                {offers.filter(o => o.status === 'active').map(offer => (
                  <div key={offer.offer_id} className="item-card">
                    <div className="item-header">
                      <div className="item-info">
                        <h4>🚗 {offer.driver_name}</h4>
                        <span className="item-meta">
                          {offer.passengers?.length || 0}/{offer.total_seats} passengers
                        </span>
                      </div>
                      <button 
                        onClick={() => handleRemoveOffer(offer.offer_id)}
                        className="remove-btn"
                        title="Remove driver"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="item-details">
                      <p>📱 {offer.driver_phone}</p>
                      <p>✉️ {offer.driver_email}</p>
                      {offer.locations?.[0] && (
                        <p>📍 {offer.locations[0].location_address}</p>
                      )}
                    </div>
                    {offer.passengers && offer.passengers.length > 0 && (
                      <div className="passengers-list">
                        <strong>Confirmed Passengers:</strong>
                        {offer.passengers.map((p, idx) => (
                          <div key={idx} className="passenger-item">
                            👤 {p.name} - {p.phone}
                            {p.pickup_location && <span className="pickup"> (📍 {p.pickup_location})</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {offer.pending_requests && offer.pending_requests.length > 0 && (
                      <div className="pending-list">
                        <strong>⏳ Pending Requests: {offer.pending_requests.length}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Passengers Tab */}
        {activeTab === 'passengers' && (
          <div className="passengers-tab">
            {requests.filter(r => r.status === 'active').length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🙋</div>
                <h3>No ride requests yet</h3>
                <p>Passenger requests will appear here.</p>
              </div>
            ) : (
              <div className="items-list">
                {requests.filter(r => r.status === 'active').map(request => (
                  <div key={request.request_id} className={`item-card ${request.is_matched ? 'matched' : ''}`}>
                    <div className="item-header">
                      <div className="item-info">
                        <h4>🙋 {request.name}</h4>
                        <span className={`match-status ${request.is_matched ? 'matched' : 'unmatched'}`}>
                          {request.is_matched ? '✅ Matched' : '⏳ Looking for ride'}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleRemoveRequest(request.request_id)}
                        className="remove-btn"
                        title="Remove request"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="item-details">
                      <p>📱 {request.phone}</p>
                      <p>✉️ {request.email}</p>
                      {request.locations?.[0] && (
                        <p>📍 {request.locations[0].location_address}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-tab">
            <div className="settings-card">
              <h3>✏️ Edit Event</h3>
              
              <div className="form-group">
                <label className="form-label">Event Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.eventName || ''}
                  onChange={(e) => setEditForm({ ...editForm, eventName: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editForm.eventDate || ''}
                    onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={editForm.eventTime || ''}
                    onChange={(e) => setEditForm({ ...editForm, eventTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">📍 Event Location</label>
                <MapLocationPicker
                  value={editForm.eventLocation || ''}
                  onChange={(value) => setEditForm({ ...editForm, eventLocation: value })}
                  onLocationSelect={(loc) => setEditForm({ 
                    ...editForm, 
                    eventLocation: loc.address,
                    eventLat: loc.lat,
                    eventLng: loc.lng
                  })}
                  placeholder="Search for event location..."
                />
                {editForm.eventLat && editForm.eventLng && (
                  <p className="location-coords">
                    ✅ Coordinates: {editForm.eventLat.toFixed(5)}, {editForm.eventLng.toFixed(5)}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editForm.isPrivate || false}
                    onChange={(e) => setEditForm({ ...editForm, isPrivate: e.target.checked })}
                  />
                  <span>Private Event (requires access code)</span>
                </label>
              </div>

              {editForm.isPrivate && (
                <div className="form-group">
                  <label className="form-label">Access Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.accessCode || ''}
                    onChange={(e) => setEditForm({ ...editForm, accessCode: e.target.value.toUpperCase() })}
                  />
                </div>
              )}

              <div className="settings-actions">
                <button 
                  onClick={handleSaveEvent} 
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="danger-zone">
              <h3>⚠️ Danger Zone</h3>
              <p>Deleting an event will remove all associated carpools and requests.</p>
              <button onClick={handleDeleteEvent} className="btn btn-danger">
                🗑️ Delete Event
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventAdminDashboard;

