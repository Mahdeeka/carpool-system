import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { API_BASE_URL as API_URL } from '../services/api';
import RouteWithDetour from '../components/RouteWithDetour';
import { SkeletonMyRidesPage } from '../components/SkeletonLoader';
import { NoOffersEmptyState, NoJoinedRidesEmptyState, NoRequestsEmptyState } from '../components/EmptyState';
import './MyRides.css';

function MyRides() {
  const navigate = useNavigate();
  const { showToast, authData, isAuthenticated } = useApp();

  const [activeTab, setActiveTab] = useState('driving');
  const [myOffers, setMyOffers] = useState([]);
  const [myJoinedRides, setMyJoinedRides] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOffer, setExpandedOffer] = useState(null);

  // Fetch event details by event_id
  const fetchEventDetails = async (eventId) => {
    try {
      const savedEventData = localStorage.getItem('eventData');
      if (savedEventData) {
        const parsed = JSON.parse(savedEventData);
        if (parsed.eventId === eventId) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  // Fetch all my offers with passenger details
  const fetchMyOffers = useCallback(async () => {
    if (!isAuthenticated) {
      setMyOffers([]);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setMyOffers([]);
        return;
      }

      const response = await fetch(`${API_URL}/auth/my-offers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        setMyOffers([]);
        return;
      }

      const data = await response.json();
      const offersWithDetails = [];

      for (const offer of (data.offers || [])) {
        try {
          const requestsRes = await fetch(`${API_URL}/carpool/offer/${offer.offer_id}/join-requests`);
          const requestsData = await requestsRes.json();
          const eventDetails = await fetchEventDetails(offer.event_id);

          offersWithDetails.push({
            ...offer,
            joinRequests: requestsData.requests || [],
            confirmedPassengers: (requestsData.requests || []).filter(r => r.status === 'confirmed'),
            pendingPassengers: (requestsData.requests || []).filter(r => r.status === 'pending'),
            eventDetails
          });
        } catch {
          // Continue with other offers if one fails
        }
      }

      setMyOffers(offersWithDetails);
    } catch {
      setMyOffers([]);
    }
  }, [isAuthenticated]);

  // Fetch rides I've joined as a passenger
  const fetchMyJoinedRides = useCallback(async () => {
    if (!isAuthenticated) {
      setMyJoinedRides([]);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setMyJoinedRides([]);
        return;
      }

      const response = await fetch(`${API_URL}/auth/my-joined-rides`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        setMyJoinedRides([]);
        return;
      }

      const data = await response.json();

      const rides = (data.rides || []).map(ride => ({
        join_request_id: ride.join_request_id,
        offer_id: ride.offer_id,
        status: ride.status,
        driverName: ride.driver_name,
        driverPhone: ride.driver_phone,
        driverEmail: ride.driver_email,
        pickupLocation: ride.pickup_location,
        pickupLat: ride.pickup_lat,
        pickupLng: ride.pickup_lng,
        message: ride.message,
        eventName: ride.event_name,
        eventDate: ride.event_date,
        eventTime: ride.event_time,
        eventLocation: ride.event_location,
        eventCode: ride.event_code,
        offerLocations: ride.offer_locations,
        totalSeats: ride.total_seats,
        availableSeats: ride.available_seats,
        tripType: ride.trip_type,
        created_at: ride.created_at,
        confirmed_at: ride.confirmed_at
      }));

      setMyJoinedRides(rides);
    } catch {
      setMyJoinedRides([]);
    }
  }, [isAuthenticated]);

  // Fetch join requests I've sent (all statuses)
  const fetchMyRequests = useCallback(async () => {
    if (!isAuthenticated) {
      setMyRequests([]);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setMyRequests([]);
        return;
      }

      const response = await fetch(`${API_URL}/auth/my-join-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        setMyRequests([]);
        return;
      }

      const data = await response.json();
      setMyRequests(data.requests || []);
    } catch {
      setMyRequests([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMyOffers(), fetchMyJoinedRides(), fetchMyRequests()]);
      setLoading(false);
    };
    if (isAuthenticated !== undefined) {
      loadData();
    }
  }, [fetchMyOffers, fetchMyJoinedRides, fetchMyRequests, isAuthenticated]);

  const handleAcceptPassenger = async (offerId, requestId) => {
    try {
      const response = await fetch(`${API_URL}/carpool/offer/${offerId}/accept-join/${requestId}`, {
        method: 'POST',
      });
      if (response.ok) {
        showToast('Passenger confirmed!', 'success');
        await fetchMyOffers();
      }
    } catch {
      showToast('Failed to accept passenger', 'error');
    }
  };

  const handleRejectPassenger = async (offerId, requestId) => {
    try {
      const response = await fetch(`${API_URL}/carpool/offer/${offerId}/reject-join/${requestId}`, {
        method: 'POST',
      });
      if (response.ok) {
        showToast('Request declined', 'success');
        await fetchMyOffers();
      }
    } catch {
      showToast('Failed to decline request', 'error');
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Cancel this join request?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/carpool/join-request/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        showToast('Request cancelled', 'success');
        await fetchMyRequests();
      } else {
        showToast('Failed to cancel request', 'error');
      }
    } catch {
      showToast('Failed to cancel request', 'error');
    }
  };

  if (loading) {
    return (
      <div className="my-rides-page">
        <SkeletonMyRidesPage />
      </div>
    );
  }

  return (
    <div className="my-rides-page">
      {/* Header */}
      <div className="my-rides-header">
        <div className="header-left">
          <button onClick={() => navigate(-1)} className="back-btn">
            ← Back
          </button>
          <h1>My Rides</h1>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => navigate('/my-account')}
            className="account-btn"
          >
            <span className="avatar">{authData?.name?.charAt(0)?.toUpperCase() || '?'}</span>
            {authData?.name?.split(' ')[0] || 'Account'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="rides-tabs">
        <button
          className={`tab ${activeTab === 'driving' ? 'active' : ''}`}
          onClick={() => setActiveTab('driving')}
        >
          🚗 My Offers ({myOffers.length})
        </button>
        <button
          className={`tab ${activeTab === 'passenger' ? 'active' : ''}`}
          onClick={() => setActiveTab('passenger')}
        >
          ✅ Confirmed ({myJoinedRides.length})
        </button>
        <button
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📋 My Requests ({myRequests.length})
        </button>
      </div>

      {/* Content */}
      <div className="rides-content">
        {activeTab === 'driving' ? (
          <div className="driving-section">
            {myOffers.length === 0 ? (
              <NoOffersEmptyState
                isAuthenticated={isAuthenticated}
                onRefresh={() => { setLoading(true); fetchMyOffers().finally(() => setLoading(false)); }}
              />
            ) : (
              <div className="offers-list">
                {myOffers.map((offer) => (
                  <div key={offer.offer_id} className="offer-card">
                    {/* Offer Header */}
                    <div className="offer-header">
                      <div className="offer-info">
                        <h3>🚗 Your Ride</h3>
                        <div className="offer-meta">
                          <span className="seats-info">
                            {offer.confirmedPassengers.length} / {offer.total_seats} passengers
                          </span>
                          {offer.pendingPassengers.length > 0 && (
                            <span className="pending-badge">
                              {offer.pendingPassengers.length} pending
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        className="expand-btn"
                        onClick={() => setExpandedOffer(expandedOffer === offer.offer_id ? null : offer.offer_id)}
                      >
                        {expandedOffer === offer.offer_id ? '▼ Hide' : '▶ Show Map'}
                      </button>
                    </div>

                    {/* Route Info */}
                    {offer.locations && offer.locations.length > 0 && (
                      <div className="route-summary">
                        <div className="route-point start">
                          <span className="point-icon">🟢</span>
                          <span>{offer.locations[0]?.location_address}</span>
                        </div>
                        <div className="route-arrow">→</div>
                        <div className="route-point end">
                          <span className="point-icon">🔴</span>
                          <span>{offer.eventDetails?.eventLocation || 'Event Location'}</span>
                        </div>
                      </div>
                    )}

                    {/* Confirmed Passengers */}
                    {offer.confirmedPassengers.length > 0 && (
                      <div className="passengers-section">
                        <h4>✅ Confirmed Passengers ({offer.confirmedPassengers.length})</h4>
                        <div className="passengers-list">
                          {offer.confirmedPassengers.map((passenger, idx) => (
                            <div key={idx} className="passenger-card confirmed">
                              <div className="passenger-info">
                                <div className="passenger-avatar">
                                  {passenger.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="passenger-details">
                                  <strong>{passenger.name}</strong>
                                  <span className="passenger-contact">
                                    📱 {passenger.phone}
                                  </span>
                                  {passenger.pickup_location && (
                                    <span className="pickup-location">
                                      📍 {passenger.pickup_location}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="passenger-actions">
                                <a
                                  href={`https://wa.me/${passenger.phone?.replace(/\D/g, '')}?text=Hi! I'm your driver for the carpool.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="whatsapp-btn-small"
                                >
                                  💬
                                </a>
                                <a href={`tel:${passenger.phone}`} className="call-btn-small">
                                  📞
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending Requests */}
                    {offer.pendingPassengers.length > 0 && (
                      <div className="passengers-section pending-section">
                        <h4>⏳ Pending Requests ({offer.pendingPassengers.length})</h4>
                        <div className="passengers-list">
                          {offer.pendingPassengers.map((passenger, idx) => (
                            <div key={idx} className="passenger-card pending">
                              <div className="passenger-info">
                                <div className="passenger-avatar pending">
                                  {passenger.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="passenger-details">
                                  <strong>{passenger.name}</strong>
                                  <span className="passenger-contact">
                                    📱 {passenger.phone}
                                  </span>
                                  {passenger.pickup_location && (
                                    <span className="pickup-location">
                                      📍 {passenger.pickup_location}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="request-actions">
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleAcceptPassenger(offer.offer_id, passenger.id)}
                                >
                                  ✅ Accept
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleRejectPassenger(offer.offer_id, passenger.id)}
                                >
                                  ❌
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expanded Details with Map */}
                    {expandedOffer === offer.offer_id && (
                      <div className="expanded-details">
                        <h4>🗺️ Route with Passengers</h4>

                        {offer.locations?.[0]?.location_address ? (
                          <div className="route-map-container">
                            {offer.confirmedPassengers.length > 0 ? (
                              offer.confirmedPassengers.map((passenger, idx) => {
                                const hasPickupCoords = passenger.pickup_lat != null && passenger.pickup_lng != null;

                                if (hasPickupCoords) {
                                  return (
                                    <div key={idx} className="passenger-route">
                                      <h5>📍 Pickup: {passenger.name}</h5>
                                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                                        {passenger.pickup_location}
                                      </p>
                                      <RouteWithDetour
                                        origin={offer.locations[0].location_address}
                                        destination={offer.eventDetails?.eventLocation || 'Event'}
                                        pickupLocation={{
                                          address: passenger.pickup_location,
                                          lat: parseFloat(passenger.pickup_lat),
                                          lng: parseFloat(passenger.pickup_lng)
                                        }}
                                        height="250px"
                                      />
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div key={idx} className="passenger-route no-coords">
                                      <h5>📍 {passenger.name}</h5>
                                      <p style={{ fontSize: '13px', color: '#92400e', background: '#fef3c7', padding: '8px 12px', borderRadius: '8px' }}>
                                        ⚠️ No pickup coordinates available
                                        {passenger.pickup_location && ` (Location: ${passenger.pickup_location})`}
                                      </p>
                                    </div>
                                  );
                                }
                              })
                            ) : (
                              <div className="no-passengers-map">
                                <p>No confirmed passengers with pickup locations yet.</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="no-passengers-map">
                            <p>No origin location set for this ride.</p>
                          </div>
                        )}

                        {/* All Passengers Summary */}
                        <div className="all-passengers-summary">
                          <h4>📋 Complete Passenger List</h4>
                          <table className="passengers-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Pickup Location</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...offer.confirmedPassengers, ...offer.pendingPassengers].map((p, idx) => (
                                <tr key={idx} className={p.status}>
                                  <td>{p.name}</td>
                                  <td>{p.phone}</td>
                                  <td>{p.pickup_location || 'Not specified'}</td>
                                  <td>
                                    <span className={`status-badge ${p.status}`}>
                                      {p.status === 'confirmed' ? '✅' : '⏳'} {p.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {offer.confirmedPassengers.length === 0 && offer.pendingPassengers.length === 0 && (
                                <tr>
                                  <td colSpan="4" style={{ textAlign: 'center', color: '#6b7280' }}>
                                    No passengers yet
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'passenger' ? (
          <div className="passenger-section">
            {myJoinedRides.length === 0 ? (
              <NoJoinedRidesEmptyState
                isAuthenticated={isAuthenticated}
                onRefresh={() => { setLoading(true); fetchMyJoinedRides().finally(() => setLoading(false)); }}
              />
            ) : (
              <div className="joined-rides-list">
                {myJoinedRides.map((ride, idx) => (
                  <div key={ride.join_request_id || idx} className="joined-ride-card">
                    <div className="ride-header">
                      <div>
                        <h3>🚗 {ride.eventName || 'Event'}</h3>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                          Riding with <strong>{ride.driverName}</strong>
                        </p>
                      </div>
                      <span className={`ride-status ${ride.status}`}>
                        {ride.status === 'confirmed' ? '✅ Confirmed' : ride.status === 'pending' ? '⏳ Pending' : ride.status}
                      </span>
                    </div>

                    <div className="ride-details">
                      <div className="detail-row">
                        <span className="detail-label">📅 Event:</span>
                        <span>{ride.eventName}</span>
                      </div>
                      {ride.eventDate && (
                        <div className="detail-row">
                          <span className="detail-label">📅 Date:</span>
                          <span>
                            {new Date(ride.eventDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })} at {ride.eventTime}
                          </span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">👤 Driver:</span>
                        <span>{ride.driverName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">📱 Driver Phone:</span>
                        <span>
                          {ride.driverPhone}
                          <a href={`tel:${ride.driverPhone}`} style={{ marginLeft: '8px', textDecoration: 'none' }}>📞</a>
                          <a
                            href={`https://wa.me/${ride.driverPhone?.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ marginLeft: '8px', textDecoration: 'none' }}
                          >
                            💬
                          </a>
                        </span>
                      </div>
                      {ride.pickupLocation && (
                        <div className="detail-row">
                          <span className="detail-label">📍 Your Pickup:</span>
                          <span>{ride.pickupLocation}</span>
                        </div>
                      )}
                      {ride.eventLocation && (
                        <div className="detail-row">
                          <span className="detail-label">🎯 Destination:</span>
                          <span>{ride.eventLocation}</span>
                        </div>
                      )}
                      {ride.message && (
                        <div className="detail-row">
                          <span className="detail-label">💬 Your Message:</span>
                          <span style={{ fontSize: '13px', color: '#475569' }}>{ride.message}</span>
                        </div>
                      )}
                    </div>

                    {/* Show route if we have locations */}
                    {ride.offerLocations?.[0]?.location_address && ride.eventLocation && ride.pickupLocation && (
                      <div style={{ marginTop: '16px' }}>
                        <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>🗺️ Route</h4>
                        <RouteWithDetour
                          origin={ride.offerLocations[0].location_address}
                          destination={ride.eventLocation}
                          pickupLocation={{
                            address: ride.pickupLocation,
                            lat: ride.pickupLat,
                            lng: ride.pickupLng
                          }}
                          height="250px"
                          showDetourInfo={ride.status === 'confirmed'}
                        />
                      </div>
                    )}

                    <div className="ride-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                      {ride.eventCode && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/event/${ride.eventCode}`)}
                        >
                          View Event
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'requests' ? (
          <div className="requests-section">
            {myRequests.length === 0 ? (
              <NoRequestsEmptyState
                isAuthenticated={isAuthenticated}
                onRefresh={() => { setLoading(true); fetchMyRequests().finally(() => setLoading(false)); }}
              />
            ) : (
              <div className="requests-list">
                {myRequests.map((request, idx) => (
                  <div key={request.id || idx} className="request-card">
                    <div className="ride-header">
                      <div>
                        <h3>🚗 {request.event_name || 'Event'}</h3>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                          Request to ride with <strong>{request.driver_name}</strong>
                        </p>
                      </div>
                      <span className={`ride-status ${request.status}`}>
                        {request.status === 'confirmed' ? '✅ Confirmed' : request.status === 'pending' ? '⏳ Pending' : request.status === 'rejected' ? '❌ Rejected' : request.status}
                      </span>
                    </div>

                    <div className="ride-details">
                      {request.event_date && (
                        <div className="detail-row">
                          <span className="detail-label">📅 Date:</span>
                          <span>
                            {new Date(request.event_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })} at {request.event_time}
                          </span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">👤 Driver:</span>
                        <span>{request.driver_name}</span>
                      </div>
                      {request.pickup_location && (
                        <div className="detail-row">
                          <span className="detail-label">📍 Pickup:</span>
                          <span>{request.pickup_location}</span>
                        </div>
                      )}
                      {request.passenger_count && request.passenger_count > 1 && (
                        <div className="detail-row">
                          <span className="detail-label">👥 Passengers:</span>
                          <span>{request.passenger_count} people</span>
                        </div>
                      )}
                      {request.message && (
                        <div className="detail-row">
                          <span className="detail-label">💬 Message:</span>
                          <span style={{ fontSize: '13px', color: '#475569' }}>{request.message}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">📅 Requested:</span>
                        <span>{new Date(request.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </div>

                    <div className="ride-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
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
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleCancelRequest(request.id)}
                          style={{ color: '#ef4444' }}
                        >
                          ❌ Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default MyRides;
