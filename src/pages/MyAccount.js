import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { updateAccount, deleteCarpoolOffer, deleteCarpoolRequest } from '../services/api';

import { API_BASE_URL as API_URL } from '../services/api';

function MyAccount() {
  const navigate = useNavigate();
  const { authData, setAuthData, isAuthenticated, authLoading, logout, showToast } = useApp();
  
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [offers, setOffers] = useState([]);
  const [rides, setRides] = useState([]); // Rides as passenger
  const [requests, setRequests] = useState([]); // Join requests sent
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { returnTo: '/my-account' } });
    }
  }, [isAuthenticated, authLoading, navigate]);
  
  // Load user data
  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
      setProfileForm({
        name: authData?.name || '',
        email: authData?.email || ''
      });
    }
  }, [isAuthenticated, authData]);
  
  const loadUserData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Fetch all data in parallel
      const [eventsRes, offersRes, ridesRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}/auth/my-events`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ events: [] })),
        fetch(`${API_URL}/auth/my-offers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ offers: [] })),
        fetch(`${API_URL}/auth/my-joined-rides`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ rides: [] })),
        fetch(`${API_URL}/auth/my-join-requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ requests: [] }))
      ]);
      
      setEvents(eventsRes.events || []);
      setOffers(offersRes.offers || []);
      setRides(ridesRes.rides || []);
      setRequests(requestsRes.requests || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load your data', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await updateAccount(profileForm);
      setAuthData(response.account);
      setEditingProfile(false);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to update profile', 'error');
    }
  };
  
  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    
    try {
      await deleteCarpoolOffer(offerId);
      setOffers(offers.filter(o => o.offer_id !== offerId));
      showToast('Offer deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete offer', 'error');
    }
  };
  
  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    
    try {
      await deleteCarpoolRequest(requestId);
      setRequests(requests.filter(r => r.id !== requestId));
      showToast('Request cancelled', 'success');
    } catch (error) {
      showToast('Failed to cancel request', 'error');
    }
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: { background: '#dcfce7', color: '#166534' },
      pending: { background: '#fef3c7', color: '#92400e' },
      rejected: { background: '#fee2e2', color: '#991b1b' },
      active: { background: '#dbeafe', color: '#1e40af' },
    };
    return styles[status] || { background: '#f3f4f6', color: '#374151' };
  };
  
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚗</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="my-account-container">
      <div className="account-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        <h1>My Account</h1>
      </div>
      
      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-card">
          <div className="profile-avatar">
            {authData?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          
          {editingProfile ? (
            <form onSubmit={handleUpdateProfile} className="profile-edit-form">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={authData?.phone || ''}
                  disabled
                />
                <small className="form-hint">Phone number cannot be changed</small>
              </div>
              <div className="profile-actions">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingProfile(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <h2>{authData?.name}</h2>
              <p className="profile-phone">📱 {authData?.phone}</p>
              <p className="profile-email">✉️ {authData?.email}</p>
              <div className="profile-actions">
                <button className="btn btn-secondary" onClick={() => setEditingProfile(true)}>
                  ✏️ Edit Profile
                </button>
                <button className="btn btn-danger" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="account-tabs">
        <button 
          className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          📅 Events ({events.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'offers' ? 'active' : ''}`}
          onClick={() => setActiveTab('offers')}
        >
          🚗 Driving ({offers.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rides' ? 'active' : ''}`}
          onClick={() => setActiveTab('rides')}
        >
          🎫 As Passenger ({rides.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📋 Requests ({requests.length})
        </button>
      </div>
      
      {/* Content */}
      <div className="account-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your data...</p>
          </div>
        ) : activeTab === 'events' ? (
          /* EVENTS TAB */
          <div className="events-list">
            {events.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No Events Yet</h3>
                <p>Create an event or join one via a shared link.</p>
                <button className="btn btn-primary" onClick={() => navigate('/create-event')}>
                  ✨ Create Event
                </button>
              </div>
            ) : (
              events.map(event => (
                <div key={event.event_id} className="item-card event-card">
                  <div className="item-header">
                    <div className="event-badge">{event.event_name}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        background: event.is_creator ? '#dbeafe' : '#dcfce7',
                        color: event.is_creator ? '#1e40af' : '#166534',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {event.is_creator ? '👑 Creator' : '✓ Joined'}
                      </span>
                    </div>
                  </div>
                  <div className="item-body">
                    <div className="item-detail">
                      <span className="detail-label">📅 Date:</span>
                      <span>
                        {event.event_date && new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric'
                        })} at {event.event_time}
                      </span>
                    </div>
                    <div className="item-detail">
                      <span className="detail-label">📍 Location:</span>
                      <span>{event.event_location}</span>
                    </div>
                    {event.stats && (
                      <div className="event-stats">
                        <span className="stat">🚗 {event.stats.total_drivers} drivers</span>
                        <span className="stat">🪑 {event.stats.total_seats} seats</span>
                      </div>
                    )}
                  </div>
                  <div className="item-actions">
                    {event.is_creator && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/event/${event.event_code}/admin`)}
                      >
                        ⚙️ Manage
                      </button>
                    )}
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/event/${event.event_code}`)}
                    >
                      🚗 Open
                    </button>
                    <button 
                      className="copy-btn-small"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/event/${event.event_code}`);
                        showToast('Link copied!', 'success');
                      }}
                    >
                      📋
                    </button>
                  </div>
                </div>
              ))
            )}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={() => navigate('/create-event')}>
                ✨ Create New Event
              </button>
            </div>
          </div>
        ) : activeTab === 'offers' ? (
          /* OFFERS TAB - rides I'm offering as driver */
          <div className="offers-list">
            {offers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🚗</div>
                <h3>No Rides Offered</h3>
                <p>You haven't offered any rides yet.</p>
              </div>
            ) : (
              offers.map(offer => (
                <div key={offer.offer_id} className="item-card">
                  <div className="item-header">
                    <div className="event-badge">{offer.event_name || 'Event'}</div>
                    <span style={{
                      ...getStatusBadge(offer.status),
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {offer.status}
                    </span>
                  </div>
                  <div className="item-body">
                    {offer.event_date && (
                      <div className="item-detail">
                        <span className="detail-label">📅 Date:</span>
                        <span>{new Date(offer.event_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="item-detail">
                      <span className="detail-label">🪑 Seats:</span>
                      <span>{offer.available_seats || offer.total_seats} / {offer.total_seats} available</span>
                    </div>
                    <div className="item-detail">
                      <span className="detail-label">🔄 Trip:</span>
                      <span>{offer.trip_type === 'both' ? 'Round Trip' : offer.trip_type}</span>
                    </div>
                    {offer.confirmed_passengers > 0 && (
                      <div className="item-detail">
                        <span className="detail-label">👥 Passengers:</span>
                        <span style={{ color: '#059669', fontWeight: 600 }}>{offer.confirmed_passengers} confirmed</span>
                      </div>
                    )}
                  </div>
                  <div className="item-actions">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/event/${offer.event_code}`)}
                    >
                      View Event
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteOffer(offer.offer_id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'rides' ? (
          /* RIDES TAB - rides I've joined as passenger */
          <div className="rides-list">
            {rides.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎫</div>
                <h3>No Rides Yet</h3>
                <p>You haven't joined any rides as a passenger.</p>
              </div>
            ) : (
              rides.map((ride, idx) => (
                <div key={ride.join_request_id || idx} className="item-card">
                  <div className="item-header">
                    <div className="event-badge">{ride.event_name || 'Event'}</div>
                    <span style={{
                      ...getStatusBadge(ride.status),
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {ride.status === 'confirmed' ? '✅ Confirmed' : ride.status}
                    </span>
                  </div>
                  <div className="item-body">
                    {ride.event_date && (
                      <div className="item-detail">
                        <span className="detail-label">📅 Date:</span>
                        <span>
                          {new Date(ride.event_date).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric'
                          })} at {ride.event_time}
                        </span>
                      </div>
                    )}
                    <div className="item-detail">
                      <span className="detail-label">👤 Driver:</span>
                      <span style={{ fontWeight: 600 }}>{ride.driver_name}</span>
                    </div>
                    {ride.driver_phone && (
                      <div className="item-detail">
                        <span className="detail-label">📱 Phone:</span>
                        <span>
                          {ride.driver_phone}
                          <a href={`tel:${ride.driver_phone}`} style={{ marginLeft: '8px' }}>📞</a>
                          <a 
                            href={`https://wa.me/${ride.driver_phone?.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ marginLeft: '4px' }}
                          >
                            💬
                          </a>
                        </span>
                      </div>
                    )}
                    {ride.pickup_location && (
                      <div className="item-detail">
                        <span className="detail-label">📍 Pickup:</span>
                        <span>{ride.pickup_location}</span>
                      </div>
                    )}
                    {ride.event_location && (
                      <div className="item-detail">
                        <span className="detail-label">🎯 Destination:</span>
                        <span>{ride.event_location}</span>
                      </div>
                    )}
                  </div>
                  <div className="item-actions">
                    {ride.event_code && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/event/${ride.event_code}`)}
                      >
                        View Event
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* REQUESTS TAB - join requests I've sent */
          <div className="requests-list">
            {requests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No Requests</h3>
                <p>You haven't sent any ride requests yet.</p>
              </div>
            ) : (
              requests.map((request, idx) => (
                <div key={request.id || idx} className="item-card">
                  <div className="item-header">
                    <div className="event-badge">{request.event_name || 'Event'}</div>
                    <span style={{
                      ...getStatusBadge(request.status),
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {request.status === 'confirmed' ? '✅ Confirmed' : 
                       request.status === 'pending' ? '⏳ Pending' : 
                       request.status === 'rejected' ? '❌ Rejected' : request.status}
                    </span>
                  </div>
                  <div className="item-body">
                    {request.event_date && (
                      <div className="item-detail">
                        <span className="detail-label">📅 Date:</span>
                        <span>
                          {new Date(request.event_date).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    <div className="item-detail">
                      <span className="detail-label">👤 Driver:</span>
                      <span>{request.driver_name}</span>
                    </div>
                    {request.pickup_location && (
                      <div className="item-detail">
                        <span className="detail-label">📍 Pickup:</span>
                        <span>{request.pickup_location}</span>
                      </div>
                    )}
                    {request.message && (
                      <div className="item-detail">
                        <span className="detail-label">💬 Message:</span>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>{request.message}</span>
                      </div>
                    )}
                    <div className="item-detail">
                      <span className="detail-label">📅 Sent:</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="item-actions">
                    {request.event_code && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/event/${request.event_code}`)}
                      >
                        View Event
                      </button>
                    )}
                    {request.status === 'pending' && (
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteRequest(request.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyAccount;
