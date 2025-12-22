import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { createCarpoolRequest } from '../services/api';
import MapLocationPicker from '../components/MapLocationPicker';
import RouteMap from '../components/RouteMap';

function NeedCarpool() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventData, setUserData, showToast, authData, isAuthenticated, authLoading } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tripType: 'both',
    isAnonymous: false,
    goingLocations: [{ address: '', lat: null, lng: null, timeType: 'flexible', specificTime: '' }],
    returnLocations: [{ address: '', lat: null, lng: null, timeType: 'flexible', specificTime: '' }],
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { returnTo: location.pathname } });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  useEffect(() => {
    if (!eventData) navigate('/');
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
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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
    
    if (formData.tripType === 'going' || formData.tripType === 'both') {
      const hasValidGoingLocation = formData.goingLocations.some(loc => loc.address.trim());
      if (!hasValidGoingLocation) newErrors.goingLocations = 'At least one going location is required';
    }
    
    if (formData.tripType === 'return' || formData.tripType === 'both') {
      const hasValidReturnLocation = formData.returnLocations.some(loc => loc.address.trim());
      if (!hasValidReturnLocation) newErrors.returnLocations = 'At least one return location is required';
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
      const locations = [];
      
      if (formData.tripType === 'going' || formData.tripType === 'both') {
        formData.goingLocations.forEach(loc => {
          if (loc.address.trim()) {
            locations.push({
              location_address: loc.address,
              lat: loc.lat,
              lng: loc.lng,
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
              lat: loc.lat,
              lng: loc.lng,
              trip_direction: 'return',
              time_type: loc.timeType,
              specific_time: loc.timeType === 'specific' ? loc.specificTime : null,
            });
          }
        });
      }
      
      const requestData = {
        event_id: eventData.eventId,
        name: authData?.name || formData.name,
        phone: authData?.phone || formData.phone,
        email: authData?.email || formData.email,
        trip_type: formData.tripType,
        is_anonymous: formData.isAnonymous,
        locations: locations,
      };
      
      const response = await createCarpoolRequest(requestData);
      
      setUserData({
        userId: response.user_id,
        requestId: response.request_id,
        role: 'passenger',
        ...requestData,
      });
      
      showToast('Carpool request created successfully!', 'success');
      navigate('/passenger-dashboard');
    } catch (error) {
      showToast(error.message || 'Failed to create carpool request', 'error');
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
        <div className="card-header">Need Carpool - {eventData.eventName}</div>
        
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
            <label className="form-label">Trip Type *</label>
            <div className="radio-group">
              <label className="radio-option">
                <input type="radio" name="tripType" value="going" 
                  checked={formData.tripType === 'going'} onChange={handleInputChange} />
                <span>הלוך בלבד</span>
              </label>
              <label className="radio-option">
                <input type="radio" name="tripType" value="return"
                  checked={formData.tripType === 'return'} onChange={handleInputChange} />
                <span>חזור בלבד</span>
              </label>
              <label className="radio-option">
                <input type="radio" name="tripType" value="both"
                  checked={formData.tripType === 'both'} onChange={handleInputChange} />
                <span>הלוך וחזור</span>
              </label>
            </div>
          </div>
          
          {showGoingLocations && (
            <div className="form-group">
              <label className="form-label">הלוך - מיקומי איסוף מבוקשים *</label>
              {formData.goingLocations.map((location, index) => (
                <div key={`going-${index}`} className="location-entry">
                  <div className="location-entry-header">
                    <span className="location-entry-title">מיקום {index + 1}</span>
                    {formData.goingLocations.length > 1 && (
                      <button type="button" className="remove-location-btn"
                        onClick={() => removeLocation('going', index)}>הסר</button>
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
                        <input type="radio" checked={location.timeType === 'flexible'}
                          onChange={() => handleLocationChange('going', index, 'timeType', 'flexible')} />
                        <span>זמן גמיש</span>
                      </label>
                      <label className="radio-option">
                        <input type="radio" checked={location.timeType === 'specific'}
                          onChange={() => handleLocationChange('going', index, 'timeType', 'specific')} />
                        <span>שעה ספציפית</span>
                      </label>
                    </div>
                  </div>
                  {location.timeType === 'specific' && (
                    <div className="form-group">
                      <input type="time" className="form-input" value={location.specificTime}
                        onChange={(e) => handleLocationChange('going', index, 'specificTime', e.target.value)} />
                    </div>
                  )}
                </div>
              ))}
              {errors.goingLocations && <div className="form-error">{errors.goingLocations}</div>}
              <button type="button" className="add-location-btn" onClick={() => addLocation('going')}>
                + הוסף מיקום נוסף להלוך
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
          
          {showReturnLocations && (
            <div className="form-group">
              <label className="form-label">חזור - מיקומי איסוף מבוקשים *</label>
              {formData.returnLocations.map((location, index) => (
                <div key={`return-${index}`} className="location-entry">
                  <div className="location-entry-header">
                    <span className="location-entry-title">מיקום {index + 1}</span>
                    {formData.returnLocations.length > 1 && (
                      <button type="button" className="remove-location-btn"
                        onClick={() => removeLocation('return', index)}>הסר</button>
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
                        <input type="radio" checked={location.timeType === 'flexible'}
                          onChange={() => handleLocationChange('return', index, 'timeType', 'flexible')} />
                        <span>זמן גמיש</span>
                      </label>
                      <label className="radio-option">
                        <input type="radio" checked={location.timeType === 'specific'}
                          onChange={() => handleLocationChange('return', index, 'timeType', 'specific')} />
                        <span>שעה ספציפית</span>
                      </label>
                    </div>
                  </div>
                  {location.timeType === 'specific' && (
                    <div className="form-group">
                      <input type="time" className="form-input" value={location.specificTime}
                        onChange={(e) => handleLocationChange('return', index, 'specificTime', e.target.value)} />
                    </div>
                  )}
                </div>
              ))}
              {errors.returnLocations && <div className="form-error">{errors.returnLocations}</div>}
              <button type="button" className="add-location-btn" onClick={() => addLocation('return')}>
                + הוסף מיקום נוסף לחזור
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
                <strong>🕵️ מצב אנונימי</strong>
                <span>הסתר את השם והטלפון שלך מנהגים עד שהם יאשרו אותך</span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button type="button" className="btn btn-secondary" 
              onClick={() => navigate('/role-selection')} disabled={loading}>← חזרה</button>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? (
                <span className="btn-car-loading">
                  <span className="mini-car">🚗</span>
                  שולח...
                </span>
              ) : 'שלח בקשת הצטרפות'}
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
              <p className="loading-text">שולח את הבקשה שלך...</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default NeedCarpool;
