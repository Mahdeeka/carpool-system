import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { requestOTP, verifyOTP, API_BASE_URL as API_URL } from '../services/api';
import './PublishRidePage.css';

// Lazy load map components
const MapLocationPicker = lazy(() => import('../components/MapLocationPicker'));
const RouteMap = lazy(() => import('../components/RouteMap'));

function PublishRidePage() {
  const { eventCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast, authData, isAuthenticated } = useApp();
  
  // Get mode from URL params: 'offer' or 'request'
  const mode = searchParams.get('mode') || 'offer';
  const isOffer = mode === 'offer';
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [authStep, setAuthStep] = useState('form'); // 'form' or 'otp'
  
  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(0);
  
  // Form data - pre-filled from auth
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
    sameReturnLocation: true,
    returnLocation: '',
    returnLat: null,
    returnLng: null,
    preference: 'any',
    description: '',
    hideName: false,
    hidePhone: false,
    hideEmail: false,
    paymentRequired: 'not_required',
    paymentAmount: '',
    paymentMethod: '',
    passengerCount: 1,
  });
  
  const [routeDistance, setRouteDistance] = useState(null);
  const [maxPayment, setMaxPayment] = useState(0);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`${API_URL}/event/${eventCode}`);
        if (response.ok) {
          const data = await response.json();
          setEvent(data);
        } else {
          showToast('Event not found', 'error');
          navigate('/');
        }
      } catch (error) {
        showToast('Failed to load event', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventCode, navigate, showToast]);

  // Pre-fill user data from auth
  useEffect(() => {
    if (isAuthenticated && authData) {
      setFormData(prev => ({
        ...prev,
        name: authData.name || '',
        phone: authData.phone || '',
        email: authData.email || '',
        gender: authData.gender || '',
      }));
    }
  }, [isAuthenticated, authData]);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRouteCalculated = (routeInfo) => {
    if (routeInfo?.distance) {
      setRouteDistance(routeInfo.distance);
      setMaxPayment(Math.ceil(routeInfo.distance * 0.7 * 1.5));
    }
  };

  const handleOtpChange = (idx, value) => {
    // Handle paste of full OTP
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (idx + i < 6) newOtp[idx + i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(idx + digits.length, 5);
      document.getElementById(`otp-${nextIdx}`)?.focus();
      return;
    }
    
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[idx] = digit;
    setOtp(newOtp);
    
    if (digit && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleRequestOTP = async () => {
    if (!formData.phone) {
      showToast('Please enter your phone number', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      await requestOTP(formData.phone);
      setAuthStep('otp');
      setOtpCountdown(60);
      showToast('Verification code sent!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to send code', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyAndPublish = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      showToast('Please enter the 6-digit code', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      await verifyOTP(formData.phone, otpCode, formData.name, formData.email, formData.gender);
      await publishRide();
    } catch (error) {
      showToast(error.message || 'Verification failed', 'error');
      setSubmitting(false);
    }
  };

  const publishRide = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = isOffer ? 'carpool/offer' : 'carpool/request';
      
      // Build locations array as expected by backend
      const locations = [];
      const returnLoc = formData.sameReturnLocation ? formData.pickupLocation : formData.returnLocation;
      
      if (formData.tripType === 'going' || formData.tripType === 'both') {
        locations.push({
          location_address: formData.pickupLocation,
          lat: formData.pickupLat,
          lng: formData.pickupLng,
          trip_direction: 'going',
          time_type: 'flexible',
          specific_time: null,
        });
      }
      
      if (formData.tripType === 'return' || formData.tripType === 'both') {
        locations.push({
          location_address: returnLoc,
          lat: formData.sameReturnLocation ? formData.pickupLat : formData.returnLat,
          lng: formData.sameReturnLocation ? formData.pickupLng : formData.returnLng,
          trip_direction: 'return',
          time_type: 'flexible',
          specific_time: null,
        });
      }
      
      const payload = {
        event_id: event.event_id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        trip_type: formData.tripType,
        preference: formData.preference,
        description: formData.description,
        hide_name: formData.hideName,
        hide_phone: formData.hidePhone,
        hide_email: formData.hideEmail,
        privacy: 'public',
        locations,
      };

      if (isOffer) {
        payload.total_seats = parseInt(formData.seats);
        payload.payment_required = formData.paymentRequired;
        payload.payment_amount = formData.paymentRequired !== 'not_required' ? parseFloat(formData.paymentAmount) : null;
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
        showToast(isOffer ? 'Ride offer published!' : 'Ride request published!', 'success');
        navigate(`/event/${eventCode}`);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to publish');
      }
    } catch (error) {
      showToast(error.message || 'Failed to publish', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    // Validate required fields
    if (!formData.name || !formData.phone) {
      showToast('Please fill in your name and phone', 'error');
      return;
    }
    if (!formData.pickupLocation) {
      showToast('Please select a pickup location', 'error');
      return;
    }
    if (!formData.gender) {
      showToast('Please select your gender', 'error');
      return;
    }

    if (isAuthenticated) {
      await publishRide();
    } else {
      await handleRequestOTP();
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.phone || !formData.gender) {
        showToast('Please fill in all required fields', 'error');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  if (loading) {
    return (
      <div className="publish-page">
        <div className="publish-loading">
          <div className="publish-loading-icon">🚗</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // OTP Verification Screen
  if (authStep === 'otp') {
    return (
      <div className="publish-page">
        <div className="publish-container">
          <div className="otp-fullscreen">
            <button className="otp-back-btn" onClick={() => { setAuthStep('form'); setOtp(['', '', '', '', '', '']); }}>
              ← Back
            </button>
            
            <div className="otp-content">
              <div className="otp-icon-large">📱</div>
              <h1>Verify Your Phone</h1>
              <p>We sent a 6-digit code to</p>
              <p className="otp-phone-display">{formData.phone}</p>
              
              <div className="otp-inputs-large">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`otp-input-large ${digit ? 'filled' : ''}`}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
              
              <div className="otp-resend-section">
                {otpCountdown > 0 ? (
                  <span className="otp-countdown">Resend in {otpCountdown}s</span>
                ) : (
                  <button className="otp-resend-btn" onClick={handleRequestOTP}>
                    Resend Code
                  </button>
                )}
              </div>
              
              <button
                className="publish-btn-large"
                onClick={handleVerifyAndPublish}
                disabled={submitting || otp.join('').length !== 6}
              >
                {submitting ? (
                  <span className="btn-loading">Verifying...</span>
                ) : (
                  <>✓ Verify & Publish</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="publish-page">
      {/* Header */}
      <header className="publish-header">
        <button className="publish-back-btn" onClick={() => navigate(`/event/${eventCode}`)}>
          ← Back
        </button>
        <div className="publish-header-info">
          <span className="publish-mode-badge">{isOffer ? '🚗 Offer a Ride' : '🙋 Request a Ride'}</span>
          <h1>{event?.event_name}</h1>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="publish-progress">
        <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <span>Your Info</span>
        </div>
        <div className="progress-line" />
        <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <span>Trip Details</span>
        </div>
        <div className="progress-line" />
        <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span>Confirm</span>
        </div>
      </div>

      {/* Form Container */}
      <div className="publish-container">
        {/* STEP 1: Personal Info */}
        {currentStep === 1 && (
          <div className="publish-step animate-in">
            <div className="step-header">
              <div className="step-icon">👤</div>
              <h2>Your Information</h2>
              <p>Let others know who you are</p>
            </div>

            {isAuthenticated && (
              <div className="auth-notice">
                <span className="auth-icon">✅</span>
                <span>Logged in as <strong>{authData?.name}</strong></span>
              </div>
            )}

            <div className="form-card">
              <div className="form-field">
                <label>Full Name <span className="required">*</span></label>
                <div className="input-with-toggle">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="form-input-modern"
                  />
                  <label className="privacy-toggle">
                    <input type="checkbox" name="hideName" checked={formData.hideName} onChange={handleInputChange} />
                    <span className="toggle-label">🔒 Hide</span>
                  </label>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>Phone Number <span className="required">*</span></label>
                  <div className="input-with-toggle">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+972..."
                      className="form-input-modern"
                    />
                    <label className="privacy-toggle">
                      <input type="checkbox" name="hidePhone" checked={formData.hidePhone} onChange={handleInputChange} />
                      <span className="toggle-label">🔒</span>
                    </label>
                  </div>
                </div>

                <div className="form-field">
                  <label>Email</label>
                  <div className="input-with-toggle">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      className="form-input-modern"
                    />
                    <label className="privacy-toggle">
                      <input type="checkbox" name="hideEmail" checked={formData.hideEmail} onChange={handleInputChange} />
                      <span className="toggle-label">🔒</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-field">
                <label>Gender <span className="required">*</span></label>
                <div className="gender-selector">
                  <label className={`gender-option male ${formData.gender === 'male' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={handleInputChange}
                    />
                    <span className="gender-icon">👨</span>
                    <span className="gender-label">Male</span>
                  </label>
                  <label className={`gender-option female ${formData.gender === 'female' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={handleInputChange}
                    />
                    <span className="gender-icon">👩</span>
                    <span className="gender-label">Female</span>
                  </label>
                </div>
              </div>

              {(formData.hideName || formData.hidePhone || formData.hideEmail) && (
                <div className="privacy-notice">
                  <span>🔒</span>
                  <span>Hidden information will only be shared after ride confirmation</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Trip Details */}
        {currentStep === 2 && (
          <div className="publish-step animate-in">
            <div className="step-header">
              <div className="step-icon">🗺️</div>
              <h2>Trip Details</h2>
              <p>Where are you {isOffer ? 'driving from' : 'located'}?</p>
            </div>

            <div className="form-card">
              {/* Trip Type */}
              <div className="form-field">
                <label>Trip Type</label>
                <div className="trip-type-selector">
                  <label className={`trip-option ${formData.tripType === 'going' ? 'selected' : ''}`}>
                    <input type="radio" name="tripType" value="going" checked={formData.tripType === 'going'} onChange={handleInputChange} />
                    <span className="trip-icon">→</span>
                    <span>Going Only</span>
                  </label>
                  <label className={`trip-option ${formData.tripType === 'return' ? 'selected' : ''}`}>
                    <input type="radio" name="tripType" value="return" checked={formData.tripType === 'return'} onChange={handleInputChange} />
                    <span className="trip-icon">←</span>
                    <span>Return Only</span>
                  </label>
                  <label className={`trip-option ${formData.tripType === 'both' ? 'selected' : ''}`}>
                    <input type="radio" name="tripType" value="both" checked={formData.tripType === 'both'} onChange={handleInputChange} />
                    <span className="trip-icon">↔</span>
                    <span>Round Trip</span>
                  </label>
                </div>
              </div>

              {/* Seats (for offers) */}
              {isOffer && (
                <div className="form-field">
                  <label>Available Seats</label>
                  <div className="seats-selector">
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <button
                        key={num}
                        type="button"
                        className={`seat-btn ${formData.seats === String(num) ? 'selected' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, seats: String(num) }))}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Passenger Count (for requests) */}
              {!isOffer && (
                <div className="form-field">
                  <label>Number of Passengers</label>
                  <div className="seats-selector">
                    {[1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        type="button"
                        className={`seat-btn ${formData.passengerCount === num ? 'selected' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, passengerCount: num }))}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pickup Location */}
              <div className="form-field">
                <label>{isOffer ? 'Starting Location' : 'Pickup Location'} <span className="required">*</span></label>
                <Suspense fallback={<div className="map-loading">Loading map...</div>}>
                  <MapLocationPicker
                    value={formData.pickupLocation}
                    onChange={(value) => setFormData(prev => ({ ...prev, pickupLocation: value }))}
                    onLocationSelect={(loc) => setFormData(prev => ({
                      ...prev,
                      pickupLocation: loc.address,
                      pickupLat: loc.lat,
                      pickupLng: loc.lng
                    }))}
                    placeholder="Search for location..."
                  />
                </Suspense>
              </div>

              {/* Route Preview */}
              {formData.pickupLat && formData.pickupLng && event?.event_location && (
                <div className="route-preview">
                  <Suspense fallback={<div className="map-loading">Loading route...</div>}>
                    <RouteMap
                      origin={{ address: formData.pickupLocation, lat: formData.pickupLat, lng: formData.pickupLng }}
                      destination={event.event_location}
                      height="200px"
                      showDirections={true}
                      onRouteCalculated={handleRouteCalculated}
                    />
                  </Suspense>
                  {routeDistance && (
                    <div className="route-info">
                      <span>📏 {routeDistance.toFixed(1)} km to {event?.event_name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Preference */}
              <div className="form-field">
                <label>Passenger Preference</label>
                <div className="preference-selector">
                  <label className={`pref-option ${formData.preference === 'any' ? 'selected' : ''}`}>
                    <input type="radio" name="preference" value="any" checked={formData.preference === 'any'} onChange={handleInputChange} />
                    <span>👥 Anyone</span>
                  </label>
                  <label className={`pref-option ${formData.preference === 'male' ? 'selected' : ''}`}>
                    <input type="radio" name="preference" value="male" checked={formData.preference === 'male'} onChange={handleInputChange} />
                    <span>👨 Men Only</span>
                  </label>
                  <label className={`pref-option ${formData.preference === 'female' ? 'selected' : ''}`}>
                    <input type="radio" name="preference" value="female" checked={formData.preference === 'female'} onChange={handleInputChange} />
                    <span>👩 Women Only</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Confirm & Payment */}
        {currentStep === 3 && (
          <div className="publish-step animate-in">
            <div className="step-header">
              <div className="step-icon">✨</div>
              <h2>Almost Done!</h2>
              <p>Review and {isOffer ? 'add payment options' : 'confirm your request'}</p>
            </div>

            {/* Summary Card */}
            <div className="summary-card">
              <h3>📋 Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Name</span>
                  <span className="summary-value">{formData.name} {formData.hideName && '🔒'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Phone</span>
                  <span className="summary-value">{formData.phone} {formData.hidePhone && '🔒'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Gender</span>
                  <span className="summary-value">{formData.gender === 'male' ? '👨 Male' : '👩 Female'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Trip</span>
                  <span className="summary-value">
                    {formData.tripType === 'both' ? '↔ Round Trip' : formData.tripType === 'going' ? '→ Going' : '← Return'}
                  </span>
                </div>
                {isOffer && (
                  <div className="summary-item">
                    <span className="summary-label">Seats</span>
                    <span className="summary-value">🪑 {formData.seats} available</span>
                  </div>
                )}
                <div className="summary-item full-width">
                  <span className="summary-label">Location</span>
                  <span className="summary-value">📍 {formData.pickupLocation}</span>
                </div>
              </div>
            </div>

            {/* Payment Options (for offers) */}
            {isOffer && (
              <div className="form-card payment-card">
                <h3>💰 Payment (Optional)</h3>
                
                <div className="payment-type-options">
                  <label className={`payment-option ${formData.paymentRequired === 'not_required' ? 'selected' : ''}`}>
                    <input type="radio" name="paymentRequired" value="not_required" checked={formData.paymentRequired === 'not_required'} onChange={handleInputChange} />
                    <span className="payment-icon">🆓</span>
                    <span>Free Ride</span>
                  </label>
                  <label className={`payment-option ${formData.paymentRequired === 'optional' ? 'selected' : ''}`}>
                    <input type="radio" name="paymentRequired" value="optional" checked={formData.paymentRequired === 'optional'} onChange={handleInputChange} />
                    <span className="payment-icon">💝</span>
                    <span>Tip Welcome</span>
                  </label>
                  <label className={`payment-option ${formData.paymentRequired === 'obligatory' ? 'selected' : ''}`}>
                    <input type="radio" name="paymentRequired" value="obligatory" checked={formData.paymentRequired === 'obligatory'} onChange={handleInputChange} />
                    <span className="payment-icon">💵</span>
                    <span>Required</span>
                  </label>
                </div>

                {formData.paymentRequired !== 'not_required' && (
                  <div className="payment-details">
                    <div className="form-row-2">
                      <div className="form-field">
                        <label>Amount (₪)</label>
                        <div className="price-input">
                          <span className="currency">₪</span>
                          <input
                            type="number"
                            name="paymentAmount"
                            value={formData.paymentAmount}
                            onChange={handleInputChange}
                            placeholder="0"
                            min="0"
                            max={maxPayment || 500}
                          />
                        </div>
                        {maxPayment > 0 && (
                          <span className="price-hint">Max suggested: ₪{maxPayment}</span>
                        )}
                      </div>
                      <div className="form-field">
                        <label>Payment Method</label>
                        <div className="method-options">
                          {['bit', 'paybox', 'cash'].map(method => (
                            <button
                              key={method}
                              type="button"
                              className={`method-btn ${formData.paymentMethod === method ? 'selected' : ''}`}
                              onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method }))}
                            >
                              {method === 'bit' ? '💳 Bit' : method === 'paybox' ? '📱 PayBox' : '💵 Cash'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="form-card">
              <div className="form-field">
                <label>Additional Notes</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={isOffer ? "Car model, meeting point details, music preferences..." : "Any special requests or information for the driver..."}
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="publish-nav">
          {currentStep > 1 && (
            <button className="nav-btn secondary" onClick={prevStep}>
              ← Previous
            </button>
          )}
          
          {currentStep < 3 ? (
            <button className="nav-btn primary" onClick={nextStep}>
              Next →
            </button>
          ) : (
            <button
              className="nav-btn publish"
              onClick={handlePublish}
              disabled={submitting}
            >
              {submitting ? (
                <span className="btn-loading">Publishing...</span>
              ) : (
                <>{isOffer ? '🚀 Publish Offer' : '🚀 Send Request'}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublishRidePage;

