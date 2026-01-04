import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { createCarpoolOffer } from '../services/api';
import MapLocationPicker from '../components/MapLocationPicker';
import RouteMap from '../components/RouteMap';
import './OfferCarpool.css';

function OfferCarpool() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventData, setUserData, showToast, authData, isAuthenticated, authLoading } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    seats: '3',
    description: '',
    tripType: 'both',
    privacy: 'public',
    isAnonymous: false,
    paymentRequired: 'not_required',
    paymentAmount: '',
    goingLocations: [{ address: '', lat: null, lng: null, timeType: 'flexible', specificTime: '' }],
    returnLocations: [{ address: '', lat: null, lng: null, timeType: 'flexible', specificTime: '' }],
  });

  const [estimatedKm, setEstimatedKm] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    // TEMP DISABLED FOR TESTING - uncomment for production
    // if (!authLoading && !isAuthenticated) {
    //   navigate('/login', { state: { returnTo: location.pathname } });
    // }
  }, [isAuthenticated, authLoading, navigate, location]);

  useEffect(() => {
    // TEMP DISABLED FOR TESTING - uncomment for production
    // if (!eventData) {
    //   navigate('/');
    // }
  }, [eventData, navigate]);

  // Pre-fill form with auth data
  useEffect(() => {
    if (authData) {
      setFormData(prev => ({
        ...prev,
        name: authData.name || '',
        phone: authData.phone || '',
        email: authData.email || ''
      }));
    }
  }, [authData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLocationChange = (direction, index, field, value) => {
    const locationKey = direction === 'going' ? 'goingLocations' : 'returnLocations';
    const newLocations = [...formData[locationKey]];
    newLocations[index][field] = value;
    setFormData(prev => ({ ...prev, [locationKey]: newLocations }));
  };

  const handleLocationSelect = (direction, index, locationData) => {
    const locationKey = direction === 'going' ? 'goingLocations' : 'returnLocations';
    const newLocations = [...formData[locationKey]];
    newLocations[index] = {
      ...newLocations[index],
      address: locationData.address,
      lat: locationData.lat,
      lng: locationData.lng
    };
    setFormData(prev => ({ ...prev, [locationKey]: newLocations }));
  };

  const addLocation = (direction) => {
    const locationKey = direction === 'going' ? 'goingLocations' : 'returnLocations';
    setFormData(prev => ({
      ...prev,
      [locationKey]: [...prev[locationKey], { address: '', lat: null, lng: null, timeType: 'flexible', specificTime: '' }]
    }));
  };

  const removeLocation = (direction, index) => {
    const locationKey = direction === 'going' ? 'goingLocations' : 'returnLocations';
    const newLocations = formData[locationKey].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [locationKey]: newLocations }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    // Validate going locations if tripType includes going
    if (formData.tripType === 'going' || formData.tripType === 'both') {
      const hasValidGoingLocation = formData.goingLocations.some(loc => loc.address.trim());
      if (!hasValidGoingLocation) {
        newErrors.goingLocations = 'At least one going location is required';
      }
    }

    // Validate return locations if tripType includes return
    if (formData.tripType === 'return' || formData.tripType === 'both') {
      const hasValidReturnLocation = formData.returnLocations.some(loc => loc.address.trim());
      if (!hasValidReturnLocation) {
        newErrors.returnLocations = 'At least one return location is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);

    try {
      // Prepare locations based on trip type
      const locations = [];

      if (formData.tripType === 'going' || formData.tripType === 'both') {
        formData.goingLocations.forEach(loc => {
          if (loc.address.trim()) {
            locations.push({
              location_address: loc.address,
              trip_direction: 'going',
              time_type: loc.timeType,
              specific_time: loc.timeType === 'specific' ? loc.specificTime : null,
            });
          }
        });
      }

      if (formData.tripType === 'return' || formData.tripType === 'both') {
        formData.returnLocations.forEach(loc => {
          if (loc.address.trim()) {
            locations.push({
              location_address: loc.address,
              trip_direction: 'return',
              time_type: loc.timeType,
              specific_time: loc.timeType === 'specific' ? loc.specificTime : null,
            });
          }
        });
      }

      // Validate payment amount if required
      if (formData.paymentRequired !== 'not_required' && formData.paymentAmount) {
        const maxPrice = estimatedKm * 0.5;
        if (parseFloat(formData.paymentAmount) > maxPrice && estimatedKm > 0) {
          showToast(`Payment cannot exceed ${maxPrice.toFixed(0)} (0.5 per km)`, 'error');
          setLoading(false);
          return;
        }
      }

      const offerData = {
        event_id: displayEventData.eventId,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        total_seats: parseInt(formData.seats),
        description: formData.description,
        trip_type: formData.tripType,
        privacy: formData.privacy,
        is_anonymous: formData.isAnonymous,
        payment_required: formData.paymentRequired,
        payment_amount: formData.paymentRequired !== 'not_required' ? parseFloat(formData.paymentAmount) || 0 : null,
        locations: locations,
      };

      const response = await createCarpoolOffer(offerData);

      setUserData({
        userId: response.user_id,
        offerId: response.offer_id,
        role: 'driver',
        ...offerData,
      });

      showToast('Carpool offer created successfully!', 'success');
      navigate('/driver-dashboard');
    } catch (error) {
      showToast(error.message || 'Failed to create carpool offer', 'error');
    } finally {
      setLoading(false);
    }
  };

  // TEMP: Use mock data for testing if no event is set
  const displayEventData = eventData || {
    eventName: 'Demo Event - Test Mode',
    eventLocation: 'Tel Aviv, Israel',
    eventId: 'demo-event-123'
  };
  
  if (authLoading) {
    return (
      <div className="offer-ride-page">
        <div className="offer-ride-main-loading">
          <div className="offer-ride-loading-icon">🚗</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  // TEMP DISABLED FOR TESTING
  // if (!isAuthenticated) return null;

  const showGoingLocations = formData.tripType === 'going' || formData.tripType === 'both';
  const showReturnLocations = formData.tripType === 'return' || formData.tripType === 'both';

  return (
    <div className="offer-ride-page">
      {/* Header */}
      <header className="offer-ride-header">
        <button className="offer-ride-back-btn" onClick={() => navigate('/role-selection')}>
          <span>←</span> Back
        </button>
        <div className="offer-ride-header-info">
          <span className="offer-ride-badge">🚗 Offer a Ride</span>
          <h1>{displayEventData.eventName}</h1>
        </div>
      </header>

      {/* Main Container */}
      <div className="offer-ride-container">
        {/* Event Destination */}
        <div className="offer-ride-destination">
          <div className="offer-ride-destination-icon">📍</div>
          <div className="offer-ride-destination-text">
            <h3>Event Destination</h3>
            <p>{displayEventData.eventLocation || 'Location not specified'}</p>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="offer-ride-user-card">
          <div className="offer-ride-user-info">
            <div className="offer-ride-user-avatar">
              {authData?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="offer-ride-user-details">
              <h4>{authData?.name}</h4>
              <p>{authData?.phone} • {authData?.email}</p>
            </div>
          </div>
          <button
            className="offer-ride-edit-profile"
            onClick={() => navigate('/my-account')}
          >
            Edit
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Trip Details Section */}
          <section className="offer-ride-form-section">
            <div className="offer-ride-section-header">
              <div className="offer-ride-section-icon">🗺️</div>
              <div className="offer-ride-section-title">
                <h3>Trip Details</h3>
                <p>Choose your trip type and available seats</p>
              </div>
            </div>

            {/* Trip Type */}
            <div className="offer-ride-field">
              <label className="offer-ride-label">
                Trip Type <span className="offer-ride-required">*</span>
              </label>
              <div className="offer-ride-trip-selector">
                <label className="offer-ride-trip-option">
                  <input
                    type="radio"
                    name="tripType"
                    value="going"
                    checked={formData.tripType === 'going'}
                    onChange={handleInputChange}
                  />
                  <div className="option-content">
                    <span className="option-icon">➡️</span>
                    <span className="option-label">Going Only</span>
                  </div>
                </label>
                <label className="offer-ride-trip-option">
                  <input
                    type="radio"
                    name="tripType"
                    value="return"
                    checked={formData.tripType === 'return'}
                    onChange={handleInputChange}
                  />
                  <div className="option-content">
                    <span className="option-icon">⬅️</span>
                    <span className="option-label">Return Only</span>
                  </div>
                </label>
                <label className="offer-ride-trip-option">
                  <input
                    type="radio"
                    name="tripType"
                    value="both"
                    checked={formData.tripType === 'both'}
                    onChange={handleInputChange}
                  />
                  <div className="option-content">
                    <span className="option-icon">↔️</span>
                    <span className="option-label">Round Trip</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Available Seats */}
            <div className="offer-ride-field">
              <label className="offer-ride-label">
                Available Seats <span className="offer-ride-required">*</span>
              </label>
              <div className="offer-ride-seats-selector">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <button
                    key={num}
                    type="button"
                    className={`offer-ride-seat-btn ${formData.seats === String(num) ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, seats: String(num) }))}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="offer-ride-field">
              <label className="offer-ride-label">Car Description / Notes</label>
              <textarea
                name="description"
                className="offer-ride-textarea"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="E.g., Toyota Camry, blue, no smoking, music preferences..."
                rows={3}
              />
            </div>
          </section>

          {/* Going Locations Section */}
          {showGoingLocations && (
            <section className="offer-ride-form-section">
              <div className="offer-ride-section-header">
                <div className="offer-ride-section-icon">🚀</div>
                <div className="offer-ride-section-title">
                  <h3>Going - Pickup Locations</h3>
                  <p>Where will you pick up passengers?</p>
                </div>
              </div>

              {formData.goingLocations.map((location, index) => (
                <div key={`going-${index}`} className="offer-ride-location-card">
                  <div className="offer-ride-location-header">
                    <div className="offer-ride-location-title">
                      <span className="offer-ride-location-number">{index + 1}</span>
                      <span>Pickup Location</span>
                    </div>
                    {formData.goingLocations.length > 1 && (
                      <button
                        type="button"
                        className="offer-ride-remove-location"
                        onClick={() => removeLocation('going', index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="offer-ride-field">
                    <MapLocationPicker
                      value={location.address}
                      onChange={(value) => handleLocationChange('going', index, 'address', value)}
                      onLocationSelect={(loc) => handleLocationSelect('going', index, loc)}
                      placeholder="Search for pickup location..."
                    />
                  </div>

                  <div className="offer-ride-time-options">
                    <label className="offer-ride-time-option">
                      <input
                        type="radio"
                        checked={location.timeType === 'flexible'}
                        onChange={() => handleLocationChange('going', index, 'timeType', 'flexible')}
                      />
                      <div className="time-content">
                        <span>🕐</span> Flexible Time
                      </div>
                    </label>
                    <label className="offer-ride-time-option">
                      <input
                        type="radio"
                        checked={location.timeType === 'specific'}
                        onChange={() => handleLocationChange('going', index, 'timeType', 'specific')}
                      />
                      <div className="time-content">
                        <span>⏰</span> Specific Time
                      </div>
                    </label>
                  </div>

                  {location.timeType === 'specific' && (
                    <div className="offer-ride-time-input">
                      <input
                        type="time"
                        className="offer-ride-input"
                        value={location.specificTime}
                        onChange={(e) => handleLocationChange('going', index, 'specificTime', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}

              {errors.goingLocations && (
                <div className="offer-ride-error">{errors.goingLocations}</div>
              )}

              <button
                type="button"
                className="offer-ride-add-location"
                onClick={() => addLocation('going')}
              >
                <span>+</span> Add Another Pickup Location
              </button>

              {/* Route Preview for Going */}
              {formData.goingLocations.some(loc => loc.address && loc.address.trim()) && displayEventData.eventLocation && (
                <div className="offer-ride-route-preview">
                  <h4>🗺️ Route Preview to Event</h4>
                  <RouteMap
                    origin={formData.goingLocations.find(loc => loc.address && loc.address.trim())?.address}
                    destination={displayEventData.eventLocation}
                    waypoints={formData.goingLocations
                      .filter(loc => loc.address && loc.address.trim())
                      .slice(1)
                      .map(loc => loc.address)}
                    height="250px"
                    onRouteCalculated={(info) => setEstimatedKm(info?.distance || 0)}
                  />
                </div>
              )}
            </section>
          )}

          {/* Return Locations Section */}
          {showReturnLocations && (
            <section className="offer-ride-form-section">
              <div className="offer-ride-section-header">
                <div className="offer-ride-section-icon">🏠</div>
                <div className="offer-ride-section-title">
                  <h3>Return - Drop-off Locations</h3>
                  <p>Where will you drop off passengers?</p>
                </div>
              </div>

              {formData.returnLocations.map((location, index) => (
                <div key={`return-${index}`} className="offer-ride-location-card">
                  <div className="offer-ride-location-header">
                    <div className="offer-ride-location-title">
                      <span className="offer-ride-location-number">{index + 1}</span>
                      <span>Drop-off Location</span>
                    </div>
                    {formData.returnLocations.length > 1 && (
                      <button
                        type="button"
                        className="offer-ride-remove-location"
                        onClick={() => removeLocation('return', index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="offer-ride-field">
                    <MapLocationPicker
                      value={location.address}
                      onChange={(value) => handleLocationChange('return', index, 'address', value)}
                      onLocationSelect={(loc) => handleLocationSelect('return', index, loc)}
                      placeholder="Search for drop-off location..."
                    />
                  </div>

                  <div className="offer-ride-time-options">
                    <label className="offer-ride-time-option">
                      <input
                        type="radio"
                        checked={location.timeType === 'flexible'}
                        onChange={() => handleLocationChange('return', index, 'timeType', 'flexible')}
                      />
                      <div className="time-content">
                        <span>🕐</span> Flexible Time
                      </div>
                    </label>
                    <label className="offer-ride-time-option">
                      <input
                        type="radio"
                        checked={location.timeType === 'specific'}
                        onChange={() => handleLocationChange('return', index, 'timeType', 'specific')}
                      />
                      <div className="time-content">
                        <span>⏰</span> Specific Time
                      </div>
                    </label>
                  </div>

                  {location.timeType === 'specific' && (
                    <div className="offer-ride-time-input">
                      <input
                        type="time"
                        className="offer-ride-input"
                        value={location.specificTime}
                        onChange={(e) => handleLocationChange('return', index, 'specificTime', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}

              {errors.returnLocations && (
                <div className="offer-ride-error">{errors.returnLocations}</div>
              )}

              <button
                type="button"
                className="offer-ride-add-location"
                onClick={() => addLocation('return')}
              >
                <span>+</span> Add Another Drop-off Location
              </button>

              {/* Route Preview for Return */}
              {formData.returnLocations.some(loc => loc.address && loc.address.trim()) && displayEventData.eventLocation && (
                <div className="offer-ride-route-preview">
                  <h4>🗺️ Route Preview from Event</h4>
                  <RouteMap
                    origin={displayEventData.eventLocation}
                    destination={formData.returnLocations.find(loc => loc.address && loc.address.trim())?.address}
                    waypoints={formData.returnLocations
                      .filter(loc => loc.address && loc.address.trim())
                      .slice(1)
                      .map(loc => loc.address)}
                    height="250px"
                  />
                </div>
              )}
            </section>
          )}

          {/* Payment Section */}
          <section className="offer-ride-form-section">
            <div className="offer-ride-section-header">
              <div className="offer-ride-section-icon">💰</div>
              <div className="offer-ride-section-title">
                <h3>Payment</h3>
                <p>Set your payment preferences</p>
              </div>
            </div>

            <div className="offer-ride-field">
              <label className="offer-ride-label">Payment Type</label>
              <div className="offer-ride-payment-options">
                <label className="offer-ride-payment-option">
                  <input
                    type="radio"
                    name="paymentRequired"
                    value="not_required"
                    checked={formData.paymentRequired === 'not_required'}
                    onChange={handleInputChange}
                  />
                  <div className="payment-content">
                    <span className="payment-icon">🆓</span>
                    <span className="payment-label">Free Ride</span>
                  </div>
                </label>
                <label className="offer-ride-payment-option">
                  <input
                    type="radio"
                    name="paymentRequired"
                    value="optional"
                    checked={formData.paymentRequired === 'optional'}
                    onChange={handleInputChange}
                  />
                  <div className="payment-content">
                    <span className="payment-icon">💝</span>
                    <span className="payment-label">Tip Welcome</span>
                  </div>
                </label>
                <label className="offer-ride-payment-option">
                  <input
                    type="radio"
                    name="paymentRequired"
                    value="obligatory"
                    checked={formData.paymentRequired === 'obligatory'}
                    onChange={handleInputChange}
                  />
                  <div className="payment-content">
                    <span className="payment-icon">💵</span>
                    <span className="payment-label">Required</span>
                  </div>
                </label>
              </div>
            </div>

            {formData.paymentRequired !== 'not_required' && (
              <div className="offer-ride-payment-amount">
                <label className="offer-ride-label">Price per Passenger</label>
                <div className="offer-ride-amount-input-wrapper">
                  <span className="offer-ride-currency">₪</span>
                  <input
                    type="number"
                    name="paymentAmount"
                    className="offer-ride-amount-input"
                    value={formData.paymentAmount}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    max={estimatedKm > 0 ? estimatedKm * 0.5 : 500}
                  />
                </div>
                {estimatedKm > 0 && (
                  <p className="offer-ride-amount-hint">
                    Max recommended: ₪{(estimatedKm * 0.5).toFixed(0)} (0.5₪/km × {estimatedKm.toFixed(0)}km)
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Privacy Section */}
          <section className="offer-ride-form-section">
            <div className="offer-ride-section-header">
              <div className="offer-ride-section-icon">🔒</div>
              <div className="offer-ride-section-title">
                <h3>Privacy Settings</h3>
                <p>Control who can see and join your ride</p>
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="offer-ride-toggle-row">
              <div className="offer-ride-toggle-info">
                <h4>🕵️ Anonymous Mode</h4>
                <p>Hide your name and phone until passengers join</p>
              </div>
              <label className="offer-ride-toggle">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                />
                <span className="offer-ride-toggle-slider"></span>
              </label>
            </div>

            {/* Privacy Options */}
            <div className="offer-ride-field">
              <label className="offer-ride-label">Ride Visibility</label>
              <div className="offer-ride-privacy-options">
                <label className="offer-ride-privacy-option">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={formData.privacy === 'public'}
                    onChange={handleInputChange}
                  />
                  <div className="privacy-content">
                    <span className="privacy-icon">🌍</span>
                    <div className="privacy-text">
                      <h5>Public</h5>
                      <p>Visible to everyone</p>
                    </div>
                  </div>
                </label>
                <label className="offer-ride-privacy-option">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={formData.privacy === 'private'}
                    onChange={handleInputChange}
                  />
                  <div className="privacy-content">
                    <span className="privacy-icon">🔐</span>
                    <div className="privacy-text">
                      <h5>Private</h5>
                      <p>Invite only</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </section>
        </form>
      </div>

      {/* Fixed Submit Section */}
      <div className="offer-ride-submit-section">
        <div className="offer-ride-submit-container">
          <button
            type="button"
            className="offer-ride-cancel-btn"
            onClick={() => navigate('/role-selection')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="offer-ride-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>Creating Ride...</>
            ) : (
              <>🚀 Create Carpool Offer</>
            )}
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="offer-ride-loading-overlay">
          <div className="offer-ride-loading-car">
            <div className="offer-ride-car-body">
              <div className="offer-ride-car-wheel front"></div>
              <div className="offer-ride-car-wheel back"></div>
            </div>
            <div className="offer-ride-loading-road"></div>
          </div>
          <p className="offer-ride-loading-text">Creating your ride offer...</p>
        </div>
      )}
    </div>
  );
}

export default OfferCarpool;
