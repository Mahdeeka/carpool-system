import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { API_BASE_URL as API_URL } from '../services/api';
import './PublishRidePage.css';

// Lazy load map components
const MapLocationPicker = lazy(() => import('../components/MapLocationPicker'));
const RouteMap = lazy(() => import('../components/RouteMap'));

// Arrow Left Icon
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

// Close Icon for modal
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

function PublishRidePage() {
  const { eventCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast, authData, setAuthData } = useApp();

  const mode = searchParams.get('mode') || 'offer';
  const isOffer = mode === 'offer';

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
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

  // OTP verification states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpStep, setOtpStep] = useState('sending'); // 'sending', 'verify', 'register'
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Fetch event
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`${API_URL}/event/${eventCode}`);
        if (response.ok) {
          const eventData = await response.json();
          setEvent(eventData);
        } else {
          // Demo event with coordinates for Tel Aviv
          setEvent({ 
            event_id: 'demo', 
            event_name: 'Demo Event', 
            event_location: 'Tel Aviv, Israel',
            location_lat: 32.0853,
            location_lng: 34.7818
          });
        }
      } catch {
        setEvent({ 
          event_id: 'demo', 
          event_name: 'Demo Event', 
          event_location: 'Tel Aviv, Israel',
          location_lat: 32.0853,
          location_lng: 34.7818
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventCode]);

  // Pre-fill from auth
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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLocationSelect = useCallback((location) => {
    setFormData(prev => ({
      ...prev,
      pickupLocation: location.address,
      pickupLat: location.lat,
      pickupLng: location.lng,
    }));
  }, []);

  const handleRouteCalculated = useCallback((routeInfo) => {
    if (routeInfo?.distance) {
      const distance = typeof routeInfo.distance === 'string'
        ? parseFloat(routeInfo.distance)
        : routeInfo.distance;
      setRouteDistance(distance);
      setMaxPayment(Math.ceil(distance * 0.7 * 1.5));
    }
    if (routeInfo?.duration) {
      setRouteDuration(routeInfo.duration);
    }
  }, []);

  // Send OTP to phone
  const sendOtp = async () => {
    setOtpSending(true);
    try {
      const response = await fetch(`${API_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone })
      });
      const data = await response.json();
      
      if (response.ok) {
        setIsNewUser(data.is_new_user);
        setOtpStep('verify');
        // Show different message based on account status
        if (data.account_exists) {
          showToast('Welcome back! Login code sent.', 'success');
        } else {
          showToast('Verification code sent!', 'success');
        }
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      showToast(error.message, 'error');
      setShowOtpModal(false);
    } finally {
      setOtpSending(false);
    }
  };

  // Verify OTP and login/register
  const verifyOtp = async () => {
    if (otp.length !== 6) {
      showToast('Please enter 6-digit OTP', 'error');
      return;
    }
    
    setOtpVerifying(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          otp,
          name: formData.name,
          email: formData.email,
          gender: formData.gender
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        // Save auth data
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authAccount', JSON.stringify(data.account));
        setAuthData(data.account);
        
        showToast('Verified successfully!', 'success');
        setShowOtpModal(false);
        
        // Now publish the ride
        await publishRide(data.token);
      } else {
        throw new Error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Actual publish function
  const publishRide = async (token) => {
    setSubmitting(true);
    try {
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
        payload.payment_amount = formData.paymentRequired === 'obligatory' 
          ? parseFloat(formData.paymentAmount) || 0 
          : null;
        payload.payment_method = formData.paymentRequired !== 'not_required' 
          ? formData.paymentMethod 
          : null;
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
        showToast(isOffer ? '🎉 Ride published!' : '🎉 Request sent!', 'success');
        navigate(`/event/${eventCode}`);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to publish');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle publish button click
  const handlePublish = async () => {
    // Validate form
    if (!formData.name || !formData.phone || !formData.gender) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (!formData.pickupLocation) {
      showToast('Please select your pickup location', 'error');
      return;
    }
    if (!formData.email) {
      showToast('Please enter your email', 'error');
      return;
    }

    const token = localStorage.getItem('authToken');
    
    // If user is logged in, publish directly
    if (authData && token) {
      await publishRide(token);
    } else {
      // User not logged in - start OTP flow
      setShowOtpModal(true);
      setOtpStep('sending');
      setOtp('');
      sendOtp();
    }
  };

  const goBack = useCallback(() => {
    navigate(`/event/${eventCode}`);
  }, [navigate, eventCode]);

  // Loading State
  if (loading) {
    return (
      <div className="publish-ride-page">
        <div className="pr-loading">
          <div className="pr-loading-spinner" />
          <p className="pr-loading-text">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="publish-ride-page">
      {/* Submitting Overlay */}
      {submitting && (
        <div className="pr-submitting">
          <div className="pr-submitting-icon">🚗</div>
          <p className="pr-submitting-text">
            {isOffer ? 'Publishing your ride...' : 'Sending your request...'}
          </p>
          <p className="pr-submitting-subtext">Please wait</p>
        </div>
      )}

      {/* Header */}
      <header className="pr-header">
        <div className="pr-header-inner">
          <button className="pr-back-btn" onClick={goBack} aria-label="Go back">
            <ArrowLeftIcon />
          </button>
          
          <h1 className="pr-header-title">
            {isOffer ? 'OFFER A RIDE' : 'REQUEST A RIDE'}
          </h1>
          
          <div className="pr-header-spacer"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pr-content">
        {/* Destination Card */}
        <div className="pr-destination">
          <div className="pr-destination-icon">📍</div>
          <div className="pr-destination-info">
            <span className="pr-destination-label">{event?.event_name}</span>
            <div className="pr-destination-address">{event?.event_location}</div>
          </div>
        </div>

        {/* Section 1: Personal Info */}
        <section className="pr-section">
          <div className="pr-section-header">
            <div className="pr-section-icon">👤</div>
            <div className="pr-section-title">
              <h3>Your Information</h3>
              <p>Let others know who you are</p>
            </div>
          </div>
          <div className="pr-section-body">
            <div className="pr-row">
              <div className="pr-field">
                <label className="pr-label">
                  Name <span className="pr-required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className="pr-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
              </div>
              <div className="pr-field">
                <label className="pr-label">
                  Phone <span className="pr-required">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="pr-input"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+972 50-123-4567"
                />
              </div>
            </div>

            <div className="pr-field">
              <label className="pr-label">Email</label>
              <input
                type="email"
                name="email"
                className="pr-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
              />
            </div>

            <div className="pr-field">
              <label className="pr-label">
                Gender <span className="pr-required">*</span>
              </label>
              <div className="pr-options">
                <button
                  type="button"
                  className={`pr-option ${formData.gender === 'male' ? 'selected' : ''}`}
                  onClick={() => updateField('gender', 'male')}
                >
                  <span className="pr-option-icon">👨</span>
                  Male
                </button>
                <button
                  type="button"
                  className={`pr-option ${formData.gender === 'female' ? 'selected' : ''}`}
                  onClick={() => updateField('gender', 'female')}
                >
                  <span className="pr-option-icon">👩</span>
                  Female
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Location */}
        <section className="pr-section">
          <div className="pr-section-header">
            <div className="pr-section-icon">📍</div>
            <div className="pr-section-title">
              <h3>Your Location</h3>
              <p>Where will you {isOffer ? 'start from' : 'be picked up'}?</p>
            </div>
          </div>
          <div className="pr-section-body">
            <Suspense fallback={
              <div className="pr-map-loading">
                <div className="pr-map-loading-spinner" />
                <p className="pr-map-loading-text">Loading map...</p>
              </div>
            }>
              <div className="pr-map-container">
                <MapLocationPicker
                  value={formData.pickupLocation}
                  onChange={(val) => updateField('pickupLocation', val)}
                  onLocationSelect={handleLocationSelect}
                  placeholder="Search for your location..."
                />
              </div>
            </Suspense>

            {/* Route Preview */}
            {formData.pickupLat && formData.pickupLng && event?.event_location && (
              <div style={{ marginTop: '16px' }}>
                <Suspense fallback={
                  <div className="pr-map-loading">
                    <div className="pr-map-loading-spinner" />
                    <p className="pr-map-loading-text">Calculating route...</p>
                  </div>
                }>
                  <div className="pr-map-container">
                    <RouteMap
                      origin={{ 
                        address: formData.pickupLocation, 
                        lat: formData.pickupLat, 
                        lng: formData.pickupLng 
                      }}
                      destination={
                        event.location_lat && event.location_lng
                          ? { address: event.event_location, lat: event.location_lat, lng: event.location_lng }
                          : event.event_location
                      }
                      height="180px"
                      showDirections={true}
                      onRouteCalculated={handleRouteCalculated}
                    />
                  </div>
                </Suspense>
                
                {(routeDistance || routeDuration) && (
                  <div className="pr-route-info">
                    {routeDistance && (
                      <>
                        <span className="pr-route-icon">🛣️</span>
                        <span className="pr-route-distance">
                          {typeof routeDistance === 'number' ? `${routeDistance.toFixed(1)} km` : routeDistance}
                        </span>
                      </>
                    )}
                    {routeDuration && (
                      <>
                        <span className="pr-route-separator">•</span>
                        <span className="pr-route-icon">⏱️</span>
                        <span className="pr-route-duration">{routeDuration}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Trip Details */}
        <section className="pr-section">
          <div className="pr-section-header">
            <div className="pr-section-icon">🚗</div>
            <div className="pr-section-title">
              <h3>Trip Details</h3>
              <p>Configure your ride preferences</p>
            </div>
          </div>
          <div className="pr-section-body">
            <div className="pr-field">
              <label className="pr-label">Trip Direction</label>
              <div className="pr-options">
                {[
                  { value: 'going', icon: '➡️', label: 'Going' },
                  { value: 'return', icon: '⬅️', label: 'Return' },
                  { value: 'both', icon: '↔️', label: 'Both' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`pr-option ${formData.tripType === opt.value ? 'selected' : ''}`}
                    onClick={() => updateField('tripType', opt.value)}
                  >
                    <span className="pr-option-icon">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pr-field">
              <label className="pr-label">
                {isOffer ? 'Available Seats' : 'Passengers'}
              </label>
              <div className="pr-seats">
                {(isOffer ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4]).map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`pr-seat ${
                      (isOffer ? formData.seats === String(n) : formData.passengerCount === n) 
                        ? 'selected' 
                        : ''
                    }`}
                    onClick={() => updateField(
                      isOffer ? 'seats' : 'passengerCount', 
                      isOffer ? String(n) : n
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="pr-field">
              <label className="pr-label">Passenger Preference</label>
              <div className="pr-options">
                {[
                  { value: 'any', icon: '👥', label: 'Anyone' },
                  { value: 'male', icon: '👨', label: 'Men' },
                  { value: 'female', icon: '👩', label: 'Women' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`pr-option ${formData.preference === opt.value ? 'selected' : ''}`}
                    onClick={() => updateField('preference', opt.value)}
                  >
                    <span className="pr-option-icon">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Payment (Offers Only) */}
        {isOffer && (
          <section className="pr-section">
            <div className="pr-section-header">
              <div className="pr-section-icon">💰</div>
              <div className="pr-section-title">
                <h3>Payment</h3>
                <p>Set your payment preferences</p>
              </div>
            </div>
            <div className="pr-section-body">
              <div className="pr-payment-types">
                {[
                  { value: 'not_required', icon: '🆓', label: 'Free Ride' },
                  { value: 'optional', icon: '💝', label: 'Tip Welcome' },
                  { value: 'obligatory', icon: '💵', label: 'Required' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`pr-payment-type ${formData.paymentRequired === opt.value ? 'selected' : ''}`}
                    onClick={() => updateField('paymentRequired', opt.value)}
                  >
                    <span className="pr-payment-type-icon">{opt.icon}</span>
                    <span className="pr-payment-type-label">{opt.label}</span>
                  </button>
                ))}
              </div>

              {formData.paymentRequired !== 'not_required' && (
                <div className="pr-payment-details">
                  {/* Only show amount for obligatory payment (not for tips) */}
                  {formData.paymentRequired === 'obligatory' && (
                    <div className="pr-field">
                      <label className="pr-label">Amount</label>
                      <div className="pr-price-wrapper">
                        <span className="pr-price-currency">₪</span>
                        <input
                          type="number"
                          name="paymentAmount"
                          className="pr-price-input"
                          value={formData.paymentAmount}
                          onChange={handleChange}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      {maxPayment > 0 && (
                        <div className="pr-price-hint">
                          Suggested max: 
                          <span className="pr-price-suggested">₪{maxPayment}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pr-field">
                    <label className="pr-label">Payment Method</label>
                    <div className="pr-method-options">
                      {[
                        { value: 'cash', icon: '💵', label: 'Cash' },
                        { value: 'bit', icon: '💳', label: 'Bit' },
                        { value: 'paybox', icon: '📱', label: 'PayBox' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`pr-method-btn ${formData.paymentMethod === opt.value ? 'selected' : ''}`}
                          onClick={() => updateField('paymentMethod', opt.value)}
                        >
                          <span>{opt.icon}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Section 5: Notes */}
        <section className="pr-section">
          <div className="pr-section-header">
            <div className="pr-section-icon">📝</div>
            <div className="pr-section-title">
              <h3>Additional Notes</h3>
              <p>Anything else to share?</p>
            </div>
          </div>
          <div className="pr-section-body">
            <textarea
              name="description"
              className="pr-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder={isOffer 
                ? "Car model, music preferences, meeting point..." 
                : "Special requests, flexibility with timing..."
              }
            />
          </div>
        </section>
      </main>

      {/* Fixed Footer */}
      <footer className="pr-footer">
        <div className="pr-footer-inner">
          <button className="pr-btn-cancel" onClick={goBack}>
            Cancel
          </button>
          <button 
            className="pr-btn-publish" 
            onClick={handlePublish}
            disabled={submitting}
          >
            🚀 {isOffer ? 'Publish Ride' : 'Send Request'}
          </button>
        </div>
      </footer>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="pr-otp-overlay">
          <div className="pr-otp-modal">
            <button 
              className="pr-otp-close" 
              onClick={() => setShowOtpModal(false)}
              aria-label="Close"
            >
              <CloseIcon />
            </button>

            {otpStep === 'sending' && (
              <div className="pr-otp-content">
                <div className="pr-otp-icon">📱</div>
                <h3>Sending Verification Code</h3>
                <p>We're sending a code to <strong>{formData.phone}</strong></p>
                <div className="pr-otp-spinner"></div>
              </div>
            )}

            {otpStep === 'verify' && (
              <div className="pr-otp-content">
                <div className="pr-otp-icon">{isNewUser ? '🆕' : '👋'}</div>
                <h3>{isNewUser ? 'Create Account' : 'Welcome Back!'}</h3>
                <p>
                  {isNewUser 
                    ? "Enter code to create your account"
                    : "You already have an account. Enter code to login."
                  }
                </p>
                
                <input
                  type="text"
                  className="pr-otp-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                
                <div className="pr-otp-actions">
                  <button 
                    className="pr-otp-resend"
                    onClick={sendOtp}
                    disabled={otpSending}
                  >
                    {otpSending ? 'Sending...' : 'Resend Code'}
                  </button>
                  <button 
                    className="pr-otp-verify"
                    onClick={verifyOtp}
                    disabled={otpVerifying || otp.length !== 6}
                  >
                    {otpVerifying ? 'Verifying...' : 'Verify & Publish'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PublishRidePage;