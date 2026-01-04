import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { API_BASE_URL as API_URL } from '../services/api';

// Lazy load map components
const MapLocationPicker = lazy(() => import('../components/MapLocationPicker'));
const RouteMap = lazy(() => import('../components/RouteMap'));

function PublishRidePage() {
  const { eventCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast, authData, isAuthenticated } = useApp();

  const mode = searchParams.get('mode') || 'offer';
  const isOffer = mode === 'offer';

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [routeDistance, setRouteDistance] = useState(null);
  const [maxPayment, setMaxPayment] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '',
    seats: '3',
    tripType: 'both',
    pickupLocation: '',
    pickupLat: null,
    pickupLng: null,
    preference: 'any',
    description: '',
    passengerCount: 1,
    paymentRequired: 'not_required',
    paymentAmount: '',
    paymentMethod: 'cash',
  });

  // Fetch event
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`${API_URL}/event/${eventCode}`);
        if (response.ok) {
          setEvent(await response.json());
        } else {
          setEvent({ event_id: 'demo', event_name: 'Demo Event', event_location: 'Tel Aviv, Israel' });
        }
      } catch {
        setEvent({ event_id: 'demo', event_name: 'Demo Event', event_location: 'Tel Aviv, Israel' });
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventCode]);

  // Pre-fill from auth (name, phone, email, gender)
  useEffect(() => {
    if (authData) {
      setFormData(prev => ({
        ...prev,
        name: authData.name || '',
        phone: authData.phone || '',
        email: authData.email || '',
        gender: authData.gender || '',
      }));
    }
  }, [authData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      pickupLocation: location.address,
      pickupLat: location.lat,
      pickupLng: location.lng,
    }));
  };

  const handleRouteCalculated = (routeInfo) => {
    if (routeInfo?.distance) {
      const distance = typeof routeInfo.distance === 'string'
        ? parseFloat(routeInfo.distance)
        : routeInfo.distance;
      setRouteDistance(distance);
      // Calculate max payment: ~0.70 NIS per km * 1.5 buffer
      setMaxPayment(Math.ceil(distance * 0.7 * 1.5));
    }
  };

  const handlePublish = async () => {
    if (!formData.name || !formData.phone || !formData.gender) {
      showToast('Please fill name, phone, and gender', 'error');
      return;
    }
    if (!formData.pickupLocation) {
      showToast('Please select your location', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = isOffer ? 'carpool/offer' : 'carpool/request';

      const payload = {
        event_id: event.event_id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        trip_type: formData.tripType,
        preference: formData.preference,
        description: formData.description,
        privacy: 'public',
        locations: [{
          location_address: formData.pickupLocation,
          lat: formData.pickupLat,
          lng: formData.pickupLng,
          trip_direction: 'going',
          time_type: 'flexible',
        }],
      };

      if (isOffer) {
        payload.total_seats = parseInt(formData.seats);
        payload.payment_required = formData.paymentRequired;
        payload.payment_amount = formData.paymentRequired !== 'not_required' ? parseFloat(formData.paymentAmount) || 0 : null;
        payload.payment_method = formData.paymentRequired !== 'not_required' ? formData.paymentMethod : null;
      } else {
        payload.passenger_count = formData.passengerCount || 1;
      }

      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast(isOffer ? 'Ride published!' : 'Request sent!', 'success');
        navigate(`/event/${eventCode}`);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Inline Styles
  const s = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0B2A4A 0%, #061527 100%)',
      paddingBottom: '100px',
    },
    header: {
      background: 'rgba(11, 42, 74, 0.95)',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      borderBottom: '1px solid rgba(14, 165, 233, 0.3)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    backBtn: {
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      color: 'white',
      padding: '10px 16px',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '14px',
    },
    badge: {
      display: 'inline-block',
      background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      color: 'white',
      marginBottom: '4px',
    },
    title: { margin: 0, fontSize: '18px', fontWeight: 600, color: 'white' },
    container: { maxWidth: '550px', margin: '0 auto', padding: '20px' },
    card: {
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '16px',
    },
    cardTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '16px',
      fontSize: '16px',
      fontWeight: 600,
      color: 'white',
    },
    destCard: {
      background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(14,165,233,0.1))',
      border: '1px solid rgba(14,165,233,0.3)',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    destLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
    destAddr: { fontSize: '16px', fontWeight: 600, color: 'white' },
    label: {
      display: 'block',
      fontSize: '12px',
      fontWeight: 600,
      color: 'rgba(255,255,255,0.7)',
      marginBottom: '8px',
      textTransform: 'uppercase',
    },
    required: { color: '#f87171' },
    input: {
      width: '100%',
      padding: '14px 16px',
      fontSize: '15px',
      background: 'rgba(255,255,255,0.08)',
      border: '2px solid rgba(255,255,255,0.15)',
      borderRadius: '12px',
      color: 'white',
      boxSizing: 'border-box',
      marginBottom: '16px',
    },
    textarea: {
      width: '100%',
      padding: '14px 16px',
      fontSize: '15px',
      background: 'rgba(255,255,255,0.08)',
      border: '2px solid rgba(255,255,255,0.15)',
      borderRadius: '12px',
      color: 'white',
      boxSizing: 'border-box',
      minHeight: '80px',
      resize: 'vertical',
      fontFamily: 'inherit',
    },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
    optionsRow: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' },
    optionBtn: (selected) => ({
      flex: '1 1 auto',
      minWidth: '80px',
      padding: '12px 10px',
      background: selected ? 'rgba(14,165,233,0.25)' : 'rgba(255,255,255,0.06)',
      border: `2px solid ${selected ? '#0EA5E9' : 'rgba(255,255,255,0.12)'}`,
      borderRadius: '12px',
      color: selected ? 'white' : 'rgba(255,255,255,0.7)',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 500,
      textAlign: 'center',
    }),
    seatBtn: (selected) => ({
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: selected ? 'linear-gradient(135deg, #0EA5E9, #0284C7)' : 'rgba(255,255,255,0.06)',
      border: `2px solid ${selected ? '#0EA5E9' : 'rgba(255,255,255,0.12)'}`,
      borderRadius: '10px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: 600,
    }),
    mapLoading: {
      padding: '30px',
      textAlign: 'center',
      color: 'rgba(255,255,255,0.5)',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      marginBottom: '16px',
    },
    routeInfo: {
      marginTop: '12px',
      padding: '12px',
      background: 'rgba(14,165,233,0.15)',
      borderRadius: '10px',
      textAlign: 'center',
      fontSize: '14px',
      color: '#7dd3fc',
    },
    priceRow: {
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-end',
    },
    priceInput: {
      flex: 1,
      padding: '14px 16px',
      fontSize: '18px',
      fontWeight: 600,
      background: 'rgba(255,255,255,0.08)',
      border: '2px solid rgba(255,255,255,0.15)',
      borderRadius: '12px',
      color: 'white',
      boxSizing: 'border-box',
    },
    priceHint: {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.5)',
      marginTop: '6px',
    },
    footer: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(11, 42, 74, 0.98)',
      borderTop: '1px solid rgba(14, 165, 233, 0.3)',
      padding: '16px 20px',
      zIndex: 100,
    },
    footerInner: { maxWidth: '550px', margin: '0 auto', display: 'flex', gap: '12px' },
    cancelBtn: {
      flex: 1,
      padding: '16px',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '12px',
      color: 'white',
      fontSize: '15px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    publishBtn: {
      flex: 2,
      padding: '16px',
      background: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
      border: 'none',
      borderRadius: '12px',
      color: 'white',
      fontSize: '15px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    loadingPage: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0B2A4A 0%, #061527 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
    },
  };

  if (loading) {
    return (
      <div style={s.loadingPage}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚗</div>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(`/event/${eventCode}`)}>← Back</button>
        <div style={{ flex: 1 }}>
          <span style={s.badge}>{isOffer ? '🚗 Offer a Ride' : '🙋 Need a Ride'}</span>
          <h1 style={s.title}>{event?.event_name}</h1>
        </div>
      </header>

      <div style={s.container}>
        {/* Event Location */}
        <div style={s.destCard}>
          <span style={{ fontSize: '28px' }}>📍</span>
          <div>
            <span style={s.destLabel}>Event Location</span>
            <div style={s.destAddr}>{event?.event_location}</div>
          </div>
        </div>

        {/* 1. Personal Info */}
        <div style={s.card}>
          <div style={s.cardTitle}>👤 Your Information</div>
          
          <div style={s.row}>
            <div>
              <label style={s.label}>Name <span style={s.required}>*</span></label>
              <input style={{...s.input, marginBottom: 0}} type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your name" />
            </div>
            <div>
              <label style={s.label}>Phone <span style={s.required}>*</span></label>
              <input style={{...s.input, marginBottom: 0}} type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+972..." />
            </div>
          </div>

          <label style={{...s.label, marginTop: '16px'}}>Email</label>
          <input style={s.input} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" />

          <label style={s.label}>Gender <span style={s.required}>*</span></label>
          <div style={s.optionsRow}>
            <button type="button" style={s.optionBtn(formData.gender === 'male')} onClick={() => setFormData(p => ({ ...p, gender: 'male' }))}>👨 Male</button>
            <button type="button" style={s.optionBtn(formData.gender === 'female')} onClick={() => setFormData(p => ({ ...p, gender: 'female' }))}>👩 Female</button>
          </div>
        </div>

        {/* 2. Location & Route */}
        <div style={s.card}>
          <div style={s.cardTitle}>📍 Your Location</div>
          
          <Suspense fallback={<div style={s.mapLoading}>Loading map...</div>}>
            <MapLocationPicker
              value={formData.pickupLocation}
              onChange={(val) => setFormData(p => ({ ...p, pickupLocation: val }))}
              onLocationSelect={handleLocationSelect}
              placeholder="Search for your location..."
            />
          </Suspense>

          {/* Route Preview */}
          {formData.pickupLat && formData.pickupLng && event?.event_location && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>🗺️ Route to Event</div>
              <Suspense fallback={<div style={s.mapLoading}>Loading route...</div>}>
                <RouteMap
                  origin={{ address: formData.pickupLocation, lat: formData.pickupLat, lng: formData.pickupLng }}
                  destination={event.event_location}
                  height="180px"
                  showDirections={true}
                  onRouteCalculated={handleRouteCalculated}
                />
              </Suspense>
              {routeDistance && (
                <div style={s.routeInfo}>
                  📏 <strong>{routeDistance.toFixed(1)} km</strong> to {event?.event_name}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Trip Details */}
        <div style={s.card}>
          <div style={s.cardTitle}>🚗 Trip Details</div>

          <label style={s.label}>Trip Type</label>
          <div style={s.optionsRow}>
            {[['going', '➡️ Going'], ['return', '⬅️ Return'], ['both', '↔️ Both']].map(([val, label]) => (
              <button key={val} type="button" style={s.optionBtn(formData.tripType === val)} onClick={() => setFormData(p => ({ ...p, tripType: val }))}>{label}</button>
            ))}
          </div>

          <label style={s.label}>{isOffer ? 'Available Seats' : 'Passengers Needed'}</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {(isOffer ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4]).map(n => (
              <button key={n} type="button" style={s.seatBtn(isOffer ? formData.seats === String(n) : formData.passengerCount === n)} onClick={() => setFormData(p => isOffer ? { ...p, seats: String(n) } : { ...p, passengerCount: n })}>{n}</button>
            ))}
          </div>

          <label style={s.label}>Passenger Preference</label>
          <div style={s.optionsRow}>
            {[['any', '👥 Anyone'], ['male', '👨 Men Only'], ['female', '👩 Women Only']].map(([val, label]) => (
              <button key={val} type="button" style={s.optionBtn(formData.preference === val)} onClick={() => setFormData(p => ({ ...p, preference: val }))}>{label}</button>
            ))}
          </div>
        </div>

        {/* 4. Payment (Offers Only) */}
        {isOffer && (
          <div style={s.card}>
            <div style={s.cardTitle}>💰 Payment</div>

            <label style={s.label}>Payment Type</label>
            <div style={s.optionsRow}>
              {[['not_required', '🆓 Free'], ['optional', '💝 Tip Welcome'], ['obligatory', '💵 Required']].map(([val, label]) => (
                <button key={val} type="button" style={s.optionBtn(formData.paymentRequired === val)} onClick={() => setFormData(p => ({ ...p, paymentRequired: val }))}>{label}</button>
              ))}
            </div>

            {formData.paymentRequired !== 'not_required' && (
              <>
                <div style={s.priceRow}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Amount (₪)</label>
                    <input
                      style={s.priceInput}
                      type="number"
                      name="paymentAmount"
                      value={formData.paymentAmount}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                    />
                    {maxPayment > 0 && <div style={s.priceHint}>Suggested max: ₪{maxPayment} (based on {routeDistance?.toFixed(1)} km)</div>}
                  </div>
                </div>

                <label style={{...s.label, marginTop: '16px'}}>Payment Method</label>
                <div style={s.optionsRow}>
                  {[['cash', '💵 Cash'], ['bit', '💳 Bit'], ['paybox', '📱 PayBox']].map(([val, label]) => (
                    <button key={val} type="button" style={s.optionBtn(formData.paymentMethod === val)} onClick={() => setFormData(p => ({ ...p, paymentMethod: val }))}>{label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 5. Notes */}
        <div style={s.card}>
          <div style={s.cardTitle}>📝 Additional Notes</div>
          <textarea
            style={s.textarea}
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={isOffer ? "Car model, meeting point, music preferences..." : "Special requests, flexibility..."}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.footerInner}>
          <button style={s.cancelBtn} onClick={() => navigate(`/event/${eventCode}`)}>Cancel</button>
          <button style={{ ...s.publishBtn, opacity: submitting ? 0.6 : 1 }} onClick={handlePublish} disabled={submitting}>
            {submitting ? 'Publishing...' : (isOffer ? '🚀 Publish Offer' : '🚀 Send Request')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PublishRidePage;
