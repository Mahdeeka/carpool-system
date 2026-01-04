import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { getPublicOffers, sendJoinRequest, getInvitations, acceptInvitation, rejectInvitation, getCarpoolRequest } from '../services/api';
import RouteMap from '../components/RouteMap';

function PassengerDashboard() {
  const navigate = useNavigate();
  const { userData, eventData, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [offers, setOffers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [confirmedMatch, setConfirmedMatch] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({}); // Track loading state per action

  useEffect(() => {
    if (!userData || userData.role !== 'passenger' || !eventData) {
      navigate('/');
      return;
    }
    loadData();
  }, [userData, eventData, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestRes, offersRes, invitationsRes] = await Promise.all([
        getCarpoolRequest(userData.requestId),
        getPublicOffers(eventData.eventId),
        getInvitations(userData.requestId)
      ]);
      setRequestDetails(requestRes);
      setOffers(offersRes.offers || []);
      setInvitations(invitationsRes.invitations || []);
      setConfirmedMatch(requestRes.match || null);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (offerId) => {
    setActionLoading(prev => ({ ...prev, [`join_${offerId}`]: true }));
    try {
      await sendJoinRequest(userData.requestId, offerId);
      showToast('Join request sent!', 'success');
      await loadData();
    } catch (error) {
      showToast(error.message || 'Failed to send request', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`join_${offerId}`]: false }));
    }
  };

  const handleAcceptInvitation = async (matchId) => {
    setActionLoading(prev => ({ ...prev, [`accept_${matchId}`]: true }));
    try {
      await acceptInvitation(userData.requestId, matchId);
      showToast('Invitation accepted!', 'success');
      await loadData();
    } catch (error) {
      showToast(error.message || 'Failed to accept invitation', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`accept_${matchId}`]: false }));
    }
  };

  const handleRejectInvitation = async (matchId) => {
    setActionLoading(prev => ({ ...prev, [`reject_${matchId}`]: true }));
    try {
      await rejectInvitation(userData.requestId, matchId);
      showToast('Invitation rejected', 'info');
      await loadData();
    } catch (error) {
      showToast(error.message || 'Failed to reject invitation', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`reject_${matchId}`]: false }));
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
            <div className="header-title">Passenger Dashboard</div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>{eventData.eventName}</div>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>Exit</button>
        </div>
      </div>

      <div className="container">
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-label">Status</div>
            <div className="stat-value" style={{ fontSize: '20px' }}>
              {confirmedMatch ? '✓ Matched' : '⏳ Searching'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Available Carpools</div>
            <div className="stat-value">{offers.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Invitations</div>
            <div className="stat-value">{invitations.length}</div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}>Browse Carpools ({offers.length})</button>
          <button className={`tab ${activeTab === 'invitations' ? 'active' : ''}`}
            onClick={() => setActiveTab('invitations')}>Invitations ({invitations.length})</button>
          {confirmedMatch && (
            <button className={`tab ${activeTab === 'confirmed' ? 'active' : ''}`}
              onClick={() => setActiveTab('confirmed')}>My Carpool</button>
          )}
        </div>

        {activeTab === 'overview' && requestDetails && (
          <div className="card">
            <h3 style={{ marginBottom: '16px' }}>Your Request Details</h3>
            <div className="contact-info">
              <div className="contact-item">🚗 Trip: <strong>{requestDetails.trip_type}</strong></div>
              <div className="contact-item">
                Status: <span className={`badge badge-${confirmedMatch ? 'success' : 'warning'}`}>
                  {confirmedMatch ? 'Matched' : 'Searching'}
                </span>
              </div>
            </div>
            <h4 style={{ marginTop: '20px', marginBottom: '12px' }}>Desired Locations:</h4>
            {requestDetails.locations?.map((loc, idx) => (
              <div key={idx} className="location-entry">
                <div><strong>{loc.trip_direction === 'going' ? '🔜' : '🔙'} {loc.location_address}</strong></div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {loc.time_type === 'flexible' ? 'Flexible time' : `Time: ${loc.specific_time}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'browse' && (
          <div>
            {offers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🚗</div>
                <div className="empty-state-title">No Carpools Available</div>
                <div className="empty-state-text">Check back later or wait for driver invitations</div>
              </div>
            ) : (
              offers.map(offer => (
                <div key={offer.offer_id} className="list-item">
                  <div className="list-item-header">
                    <div className="list-item-title">{offer.driver_name}</div>
                    <span className="badge badge-info">{offer.available_seats} seats</span>
                  </div>
                  <div className="contact-info">
                    <div className="contact-item">📞 {offer.driver_phone}</div>
                    <div className="contact-item">🚗 {offer.description || 'No description'}</div>
                    <div className="contact-item">📍 {offer.locations?.map(l => l.location_address).join(', ')}</div>
                    <div className="contact-item">🚦 {offer.trip_type}</div>
                  </div>
                  <div className="list-item-footer">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSendRequest(offer.offer_id)}
                      disabled={offer.available_seats === 0 || actionLoading[`join_${offer.offer_id}`]}
                    >
                      {actionLoading[`join_${offer.offer_id}`] ? 'Sending...' : 'Request to Join'}
                    </button>
                    <a href={getWhatsAppLink(offer.driver_phone)}
                      className="whatsapp-btn" target="_blank" rel="noopener noreferrer">
                      💬 WhatsApp
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'invitations' && (
          <div>
            {invitations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📬</div>
                <div className="empty-state-title">No Invitations</div>
                <div className="empty-state-text">Drivers will send you invitations here</div>
              </div>
            ) : (
              invitations.map(invitation => (
                <div key={invitation.match_id} className="list-item">
                  <div className="list-item-header">
                    <div className="list-item-title">{invitation.driver_name}</div>
                    <span className="badge badge-warning">Pending</span>
                  </div>
                  <div className="contact-info">
                    <div className="contact-item">📞 {invitation.driver_phone}</div>
                    <div className="contact-item">📧 {invitation.driver_email}</div>
                    <div className="contact-item">🚗 {invitation.car_description}</div>
                    <div className="contact-item">📍 {invitation.location}</div>
                  </div>
                  <div className="list-item-footer">
                    <button
                      className="btn btn-success"
                      onClick={() => handleAcceptInvitation(invitation.match_id)}
                      disabled={actionLoading[`accept_${invitation.match_id}`] || actionLoading[`reject_${invitation.match_id}`]}
                    >
                      {actionLoading[`accept_${invitation.match_id}`] ? 'Accepting...' : '✓ Accept'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleRejectInvitation(invitation.match_id)}
                      disabled={actionLoading[`accept_${invitation.match_id}`] || actionLoading[`reject_${invitation.match_id}`]}
                    >
                      {actionLoading[`reject_${invitation.match_id}`] ? 'Declining...' : '✗ Decline'}
                    </button>
                    <a href={getWhatsAppLink(invitation.driver_phone)}
                      className="whatsapp-btn" target="_blank" rel="noopener noreferrer">
                      💬 WhatsApp
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'confirmed' && confirmedMatch && (
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>✓ ההסעה המאושרת שלך</h3>
            <div className="list-item-title" style={{ marginBottom: '16px' }}>
              {confirmedMatch.driver_name}
            </div>
            <div className="contact-info">
              <div className="contact-item">📞 {confirmedMatch.driver_phone}</div>
              <div className="contact-item">📧 {confirmedMatch.driver_email}</div>
              <div className="contact-item">🚗 {confirmedMatch.car_description}</div>
              <div className="contact-item">📍 איסוף: {confirmedMatch.pickup_location}</div>
              <div className="contact-item">🕐 שעה: {confirmedMatch.pickup_time || 'גמיש'}</div>
            </div>
            
            {/* Route Map */}
            {confirmedMatch.pickup_location && eventData.eventLocation && (
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ marginBottom: '12px' }}>🗺️ מפת המסלול</h4>
                <RouteMap
                  origin={confirmedMatch.pickup_location}
                  destination={eventData.eventLocation}
                  height="300px"
                />
              </div>
            )}
            
            <div style={{ marginTop: '20px' }}>
              <a href={getWhatsAppLink(confirmedMatch.driver_phone)}
                className="whatsapp-btn" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', padding: '12px 24px', fontSize: '16px' }}>
                💬 צור קשר עם הנהג בוואטסאפ
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PassengerDashboard;
