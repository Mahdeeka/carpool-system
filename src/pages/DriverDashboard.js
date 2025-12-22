import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { getOfferRequests, acceptRequest, rejectRequest, getPassengers, sendInvitation, getCarpoolOffer } from '../services/api';
import RouteMap from '../components/RouteMap';

function DriverDashboard() {
  const navigate = useNavigate();
  const { userData, eventData, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [requests, setRequests] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [confirmedMatches, setConfirmedMatches] = useState([]);
  const [offerDetails, setOfferDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData || userData.role !== 'driver' || !eventData) {
      navigate('/');
      return;
    }
    loadData();
  }, [userData, eventData, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [offerRes, requestsRes] = await Promise.all([
        getCarpoolOffer(userData.offerId),
        getOfferRequests(userData.offerId)
      ]);
      setOfferDetails(offerRes);
      setRequests(requestsRes.requests || []);
      setConfirmedMatches(offerRes.matches || []);
      
      if (offerRes.privacy === 'private') {
        const passengersRes = await getPassengers(eventData.eventId);
        setPassengers(passengersRes.passengers || []);
      }
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptRequest(userData.offerId, requestId);
      showToast('Request accepted!', 'success');
      loadData();
    } catch (error) {
      showToast('Failed to accept request', 'error');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectRequest(userData.offerId, requestId);
      showToast('Request rejected', 'info');
      loadData();
    } catch (error) {
      showToast('Failed to reject request', 'error');
    }
  };

  const handleSendInvitation = async (requestId) => {
    try {
      await sendInvitation(userData.offerId, requestId);
      showToast('Invitation sent!', 'success');
    } catch (error) {
      showToast('Failed to send invitation', 'error');
    }
  };

  const getWhatsAppLink = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=Hi, regarding carpool for ${eventData.eventName}`;
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="header">
        <div className="header-content">
          <div>
            <div className="header-title">Driver Dashboard</div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>{eventData.eventName}</div>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>Exit</button>
        </div>
      </div>

      <div className="container">
        {offerDetails && (
          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-label">Available Seats</div>
              <div className="stat-value">{offerDetails.available_seats}/{offerDetails.total_seats}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Confirmed Passengers</div>
              <div className="stat-value">{confirmedMatches.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending Requests</div>
              <div className="stat-value">{requests.filter(r => r.status === 'pending').length}</div>
            </div>
          </div>
        )}

        <div className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} 
            onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}>Requests ({requests.length})</button>
          {offerDetails?.privacy === 'private' && (
            <button className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}>Browse Passengers</button>
          )}
          <button className={`tab ${activeTab === 'confirmed' ? 'active' : ''}`}
            onClick={() => setActiveTab('confirmed')}>Confirmed ({confirmedMatches.length})</button>
        </div>

        {activeTab === 'overview' && offerDetails && (
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>פרטי ההסעה שלך</h3>
            <div className="contact-info">
              <div className="contact-item">📍 פרטיות: <strong>{offerDetails.privacy === 'public' ? 'ציבורי' : 'פרטי'}</strong></div>
              <div className="contact-item">🚗 סוג נסיעה: <strong>{offerDetails.trip_type === 'both' ? 'הלוך וחזור' : offerDetails.trip_type === 'going' ? 'הלוך' : 'חזור'}</strong></div>
              {offerDetails.description && (
                <div className="contact-item">📝 {offerDetails.description}</div>
              )}
            </div>
            
            <h4 style={{ marginTop: '20px', marginBottom: '12px' }}>מיקומים:</h4>
            {offerDetails.locations?.map((loc, idx) => (
              <div key={idx} className="location-entry">
                <div><strong>{loc.trip_direction === 'going' ? '🔜' : '🔙'} {loc.location_address}</strong></div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {loc.time_type === 'flexible' ? 'זמן גמיש' : `שעה: ${loc.specific_time}`}
                </div>
              </div>
            ))}

            {/* Route Map */}
            {offerDetails.locations?.length > 0 && eventData.eventLocation && (
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ marginBottom: '12px' }}>🗺️ מפת המסלול</h4>
                <RouteMap
                  origin={offerDetails.locations.find(l => l.trip_direction === 'going')?.location_address || offerDetails.locations[0]?.location_address}
                  destination={eventData.eventLocation}
                  waypoints={offerDetails.locations
                    .filter(l => l.trip_direction === 'going')
                    .slice(1)
                    .map(l => l.location_address)}
                  height="350px"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            {requests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-title">No Requests Yet</div>
                <div className="empty-state-text">Passengers will appear here when they request to join your carpool</div>
              </div>
            ) : (
              requests.map(request => (
                <div key={request.request_id} className="list-item">
                  <div className="list-item-header">
                    <div className="list-item-title">{request.passenger_name}</div>
                    <span className={`badge badge-${request.status === 'pending' ? 'warning' : 'info'}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="contact-info">
                    <div className="contact-item">📞 {request.passenger_phone}</div>
                    <div className="contact-item">📧 {request.passenger_email}</div>
                    <div className="contact-item">📍 {request.location}</div>
                  </div>
                  {request.status === 'pending' && (
                    <div className="list-item-footer">
                      <button className="btn btn-success" onClick={() => handleAcceptRequest(request.request_id)}>
                        ✓ Accept
                      </button>
                      <button className="btn btn-danger" onClick={() => handleRejectRequest(request.request_id)}>
                        ✗ Reject
                      </button>
                      <a href={getWhatsAppLink(request.passenger_phone)} 
                        className="whatsapp-btn" target="_blank" rel="noopener noreferrer">
                        💬 WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'browse' && (
          <div>
            {passengers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <div className="empty-state-title">No Passengers Available</div>
              </div>
            ) : (
              passengers.map(passenger => (
                <div key={passenger.request_id} className="list-item">
                  <div className="list-item-header">
                    <div className="list-item-title">{passenger.name}</div>
                  </div>
                  <div className="contact-info">
                    <div className="contact-item">📞 {passenger.phone}</div>
                    <div className="contact-item">📧 {passenger.email}</div>
                    <div className="contact-item">📍 {passenger.locations?.map(l => l.location_address).join(', ')}</div>
                  </div>
                  <div className="list-item-footer">
                    <button className="btn btn-primary" onClick={() => handleSendInvitation(passenger.request_id)}>
                      Send Invitation
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'confirmed' && (
          <div>
            {confirmedMatches.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✓</div>
                <div className="empty-state-title">No Confirmed Passengers Yet</div>
              </div>
            ) : (
              confirmedMatches.map(match => (
                <div key={match.match_id} className="list-item">
                  <div className="list-item-header">
                    <div className="list-item-title">{match.passenger_name}</div>
                    <span className="badge badge-success">Confirmed</span>
                  </div>
                  <div className="contact-info">
                    <div className="contact-item">📞 {match.passenger_phone}</div>
                    <div className="contact-item">📧 {match.passenger_email}</div>
                    <div className="contact-item">📍 {match.pickup_location}</div>
                    <div className="contact-item">🕐 {match.pickup_time || 'Flexible'}</div>
                  </div>
                  <div className="list-item-footer">
                    <a href={getWhatsAppLink(match.passenger_phone)} 
                      className="whatsapp-btn" target="_blank" rel="noopener noreferrer">
                      💬 WhatsApp
                    </a>
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

export default DriverDashboard;
