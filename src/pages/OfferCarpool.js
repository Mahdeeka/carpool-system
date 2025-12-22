import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { createCarpoolOffer } from '../services/api';
import MapLocationPicker from '../components/MapLocationPicker';
import RouteMap from '../components/RouteMap';

function OfferCarpool() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventData, setUserData, showToast, authData, isAuthenticated, authLoading } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    seats: '1',
    description: '',
    tripType: 'both',
    privacy: 'public',
    isAnonymous: false,
    paymentRequired: 'not_required',
    paymentAmount: '',
    goingLocations: [{ address: '', lat: null, lng: null, timeType: 'flexible', specificTime: '' }],
    returnLocations: [{ address: '', lat: null, lng: null, timeType: 'flexible', specificTime: '' }],
  });
  
  // eslint-disable-next-line no-unused-vars
  const [estimatedKm, setEstimatedKm] = useState(0);
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { returnTo: location.pathname } });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  useEffect(() => {
    if (!eventData) {
      navigate('/');
    }
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
          showToast(`Payment cannot exceed ₪${maxPrice.toFixed(0)} (0.5 per km)`, 'error');
          setLoading(false);
          return;
        }
      }
      
      const offerData = {
        event_id: eventData.eventId,
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

  if (!eventData) return null;
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="car-animation">
          <div className="car-loader">
            <div className="car-body">
              <div className="car-top"></div>
              <div className="car-bottom"></div>
              <div className="car-window"></div>
              <div className="car-light"></div>
              <div className="car-wheel car-wheel-front"></div>
              <div className="car-wheel car-wheel-back"></div>
            </div>
            <div className="car-road"></div>
          </div>
        </div>
        <p>Loading...</p>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const showGoingLocations = formData.tripType === 'going' || formData.tripType === 'both';
  const showReturnLocations = formData.tripType === 'return' || formData.tripType === 'both';

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="card-header">
          Offer Carpool - {eventData.eventName}
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Event Destination Info */}
          <div className="event-destination-box">
            <h4>📍 יעד האירוע</h4>
            <p>{eventData.eventLocation || 'לא הוגדר מיקום לאירוע'}</p>
          </div>
          
          {/* User Info from Account */}
          <div className="auth-user-info">
            <div className="auth-user-badge">
              <span className="auth-avatar">{authData?.name?.charAt(0)?.toUpperCase()}</span>
              <div className="auth-details">
                <strong>{authData?.name}</strong>
                <span>{authData?.phone} • {authData?.email}</span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn btn-link"
              onClick={() => navigate('/my-account')}
            >
              Edit Profile
            </button>
          </div>
          
          <div className="form-group">
            <label className="form-label">Available Seats *</label>
            <select
              name="seats"
              className="form-select"
              value={formData.seats}
              onChange={handleInputChange}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Car Description / Notes (Optional)</label>
            <textarea
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="E.g., Toyota Camry, blue, no smoking, etc."
            />
          </div>
          
          {/* Trip Type */}
          <div className="form-group">
            <label className="form-label">Trip Type *</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="tripType"
                  value="going"
                  checked={formData.tripType === 'going'}
                  onChange={handleInputChange}
                />
                <span>Going Only</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="tripType"
                  value="return"
                  checked={formData.tripType === 'return'}
                  onChange={handleInputChange}
                />
                <span>Return Only</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="tripType"
                  value="both"
                  checked={formData.tripType === 'both'}
                  onChange={handleInputChange}
                />
                <span>Round Trip</span>
              </label>
            </div>
          </div>
          
          {/* Going Locations */}
          {showGoingLocations && (
            <div className="form-group">
              <label className="form-label">Going - Pickup Locations *</label>
              {formData.goingLocations.map((location, index) => (
                <div key={`going-${index}`} className="location-entry">
                  <div className="location-entry-header">
                    <span className="location-entry-title">Location {index + 1}</span>
                    {formData.goingLocations.length > 1 && (
                      <button
                        type="button"
                        className="remove-location-btn"
                        onClick={() => removeLocation('going', index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <MapLocationPicker
                      value={location.address}
                      onChange={(value) => handleLocationChange('going', index, 'address', value)}
                      onLocationSelect={(loc) => handleLocationSelect('going', index, loc)}
                      placeholder="חפש מיקום לאיסוף..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <div className="radio-group">
                      <label className="radio-option">
                        <input
                          type="radio"
                          checked={location.timeType === 'flexible'}
                          onChange={() => handleLocationChange('going', index, 'timeType', 'flexible')}
                        />
                        <span>זמן גמיש</span>
                      </label>
                      <label className="radio-option">
                        <input
                          type="radio"
                          checked={location.timeType === 'specific'}
                          onChange={() => handleLocationChange('going', index, 'timeType', 'specific')}
                        />
                        <span>שעה ספציפית</span>
                      </label>
                    </div>
                  </div>
                  
                  {location.timeType === 'specific' && (
                    <div className="form-group">
                      <input
                        type="time"
                        className="form-input"
                        value={location.specificTime}
                        onChange={(e) => handleLocationChange('going', index, 'specificTime', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
              {errors.goingLocations && <div className="form-error">{errors.goingLocations}</div>}
              <button
                type="button"
                className="add-location-btn"
                onClick={() => addLocation('going')}
              >
                + Add Another Going Location
              </button>
              
              {/* Route Preview Map for Going */}
              {formData.goingLocations.some(loc => loc.address && loc.address.trim()) && (
                <div className="route-preview-section">
                  <h4 className="route-preview-title">🗺️ תצוגת מסלול הלוך לאירוע</h4>
                  {eventData.eventLocation ? (
                    <RouteMap
                      origin={formData.goingLocations.find(loc => loc.address && loc.address.trim())?.address}
                      destination={eventData.eventLocation}
                      waypoints={formData.goingLocations
                        .filter(loc => loc.address && loc.address.trim())
                        .slice(1)
                        .map(loc => loc.address)}
                      height="300px"
                    />
                  ) : (
                    <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center', direction: 'rtl' }}>
                      <p style={{ margin: 0, color: '#92400e' }}>⚠️ לא הוגדר מיקום לאירוע. המפה תוצג לאחר הגדרת יעד האירוע.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Return Locations */}
          {showReturnLocations && (
            <div className="form-group">
              <label className="form-label">Return - Pickup Locations *</label>
              {formData.returnLocations.map((location, index) => (
                <div key={`return-${index}`} className="location-entry">
                  <div className="location-entry-header">
                    <span className="location-entry-title">Location {index + 1}</span>
                    {formData.returnLocations.length > 1 && (
                      <button
                        type="button"
                        className="remove-location-btn"
                        onClick={() => removeLocation('return', index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <MapLocationPicker
                      value={location.address}
                      onChange={(value) => handleLocationChange('return', index, 'address', value)}
                      onLocationSelect={(loc) => handleLocationSelect('return', index, loc)}
                      placeholder="חפש מיקום לאיסוף..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <div className="radio-group">
                      <label className="radio-option">
                        <input
                          type="radio"
                          checked={location.timeType === 'flexible'}
                          onChange={() => handleLocationChange('return', index, 'timeType', 'flexible')}
                        />
                        <span>זמן גמיש</span>
                      </label>
                      <label className="radio-option">
                        <input
                          type="radio"
                          checked={location.timeType === 'specific'}
                          onChange={() => handleLocationChange('return', index, 'timeType', 'specific')}
                        />
                        <span>שעה ספציפית</span>
                      </label>
                    </div>
                  </div>
                  
                  {location.timeType === 'specific' && (
                    <div className="form-group">
                      <input
                        type="time"
                        className="form-input"
                        value={location.specificTime}
                        onChange={(e) => handleLocationChange('return', index, 'specificTime', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
              {errors.returnLocations && <div className="form-error">{errors.returnLocations}</div>}
              <button
                type="button"
                className="add-location-btn"
                onClick={() => addLocation('return')}
              >
                + Add Another Return Location
              </button>
              
              {/* Route Preview Map for Return */}
              {formData.returnLocations.some(loc => loc.address && loc.address.trim()) && (
                <div className="route-preview-section">
                  <h4 className="route-preview-title">🗺️ תצוגת מסלול חזור מהאירוע</h4>
                  {eventData.eventLocation ? (
                    <RouteMap
                      origin={eventData.eventLocation}
                      destination={formData.returnLocations.find(loc => loc.address && loc.address.trim())?.address}
                      waypoints={formData.returnLocations
                        .filter(loc => loc.address && loc.address.trim())
                        .slice(1)
                        .map(loc => loc.address)}
                      height="300px"
                    />
                  ) : (
                    <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center', direction: 'rtl' }}>
                      <p style={{ margin: 0, color: '#92400e' }}>⚠️ לא הוגדר מיקום לאירוע. המפה תוצג לאחר הגדרת יעד האירוע.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Anonymous Mode Toggle */}
          <div className="form-group">
            <div className="anonymous-toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                />
                <span className="toggle-slider-switch"></span>
              </label>
              <div className="toggle-label-content">
                <strong>🕵️ Anonymous Mode</strong>
                <span>Hide your name and phone from other users until they join your ride</span>
              </div>
            </div>
          </div>
          
          {/* Payment Options */}
          <div className="form-group">
            <label className="form-label">💰 Payment Requirement</label>
            <div className="radio-group payment-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="paymentRequired"
                  value="not_required"
                  checked={formData.paymentRequired === 'not_required'}
                  onChange={handleInputChange}
                />
                <span>🆓 Not Required</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="paymentRequired"
                  value="optional"
                  checked={formData.paymentRequired === 'optional'}
                  onChange={handleInputChange}
                />
                <span>🙏 Optional</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="paymentRequired"
                  value="obligatory"
                  checked={formData.paymentRequired === 'obligatory'}
                  onChange={handleInputChange}
                />
                <span>💳 Obligatory</span>
              </label>
            </div>
            
            {formData.paymentRequired !== 'not_required' && (
              <div className="payment-amount-section">
                <label className="form-label">Price per Passenger (₪)</label>
                <div className="payment-input-wrapper">
                  <input
                    type="number"
                    name="paymentAmount"
                    className="form-input"
                    value={formData.paymentAmount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    min="0"
                    max={estimatedKm > 0 ? estimatedKm * 0.5 : 1000}
                  />
                  <span className="payment-currency">₪</span>
                </div>
                {estimatedKm > 0 && (
                  <p className="form-hint">
                    Max allowed: ₪{(estimatedKm * 0.5).toFixed(0)} (0.5₪/km × {estimatedKm.toFixed(0)}km)
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Privacy Settings */}
          <div className="form-group">
            <label className="form-label">Privacy Setting *</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="privacy"
                  value="public"
                  checked={formData.privacy === 'public'}
                  onChange={handleInputChange}
                />
                <span>Public - Visible to everyone</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="privacy"
                  value="private"
                  checked={formData.privacy === 'private'}
                  onChange={handleInputChange}
                />
                <span>Private - I'll invite passengers</span>
              </label>
            </div>
          </div>
          
          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/role-selection')}
              disabled={loading}
            >
              ← Back
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-car-loading">
                  <span className="mini-car">🚗</span>
                  Creating...
                </span>
              ) : 'Create Carpool Offer'}
            </button>
          </div>
          
          {/* Full screen car animation while submitting */}
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
              <p className="loading-text">Creating your ride offer...</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default OfferCarpool;
