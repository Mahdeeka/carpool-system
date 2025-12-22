import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import './MapLocationPicker.css';

const GOOGLE_API_KEY = 'AIzaSyDnWINn8Mh5rx7KvlIgIZA37c0DQo9eimk';

// Default center on Israel
const ISRAEL_CENTER = { lat: 32.0853, lng: 34.7818 };

// Check if Google Maps is fully loaded and working
const isGoogleMapsReady = () => {
  return typeof window !== 'undefined' && 
         window.google && 
         window.google.maps && 
         window.google.maps.places &&
         window.google.maps.Map;
};

// Map Modal rendered via Portal to avoid React DOM conflicts
function MapModal({ isOpen, onClose, onConfirm, initialLocation, mapsAvailable }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (!isOpen || !mapRef.current || !mapsAvailable || !isGoogleMapsReady()) return;

    // Small delay to ensure DOM is ready
    const initTimeout = setTimeout(() => {
      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : ISRAEL_CENTER,
          zoom: selectedLocation ? 15 : 8,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;

        // Add existing marker if location selected
        if (selectedLocation) {
          markerRef.current = new window.google.maps.Marker({
            position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
            map,
            draggable: true,
            animation: window.google.maps.Animation.DROP,
          });

          markerRef.current.addListener('dragend', () => {
            const pos = markerRef.current.getPosition();
            reverseGeocode(pos.lat(), pos.lng());
          });
        }

        // Click to place marker
        map.addListener('click', (e) => {
          const position = e.latLng;
          
          if (!markerRef.current) {
            markerRef.current = new window.google.maps.Marker({
              position,
              map,
              draggable: true,
              animation: window.google.maps.Animation.DROP,
            });

            markerRef.current.addListener('dragend', () => {
              const pos = markerRef.current.getPosition();
              reverseGeocode(pos.lat(), pos.lng());
            });
          } else {
            markerRef.current.setPosition(position);
          }

          reverseGeocode(position.lat(), position.lng());
        });
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    }, 100);

    return () => {
      clearTimeout(initTimeout);
      if (markerRef.current) {
        try { markerRef.current.setMap(null); } catch (e) {}
        markerRef.current = null;
      }
      if (mapInstanceRef.current) {
        try { window.google.maps.event.clearInstanceListeners(mapInstanceRef.current); } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mapsAvailable]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=he&key=${GOOGLE_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;
        
        const locality = addressComponents.find(comp => 
          comp.types.includes('locality')
        ) || addressComponents.find(comp => 
          comp.types.includes('administrative_area_level_2')
        );

        setSelectedLocation({
          address: result.formatted_address,
          lat,
          lng,
          name: locality?.long_name || result.formatted_address
        });
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('הדפדפן שלך לא תומך באיתור מיקום');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        await reverseGeocode(latitude, longitude);
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
          mapInstanceRef.current.setZoom(15);
          
          if (markerRef.current) {
            markerRef.current.setPosition({ lat: latitude, lng: longitude });
          } else {
            markerRef.current = new window.google.maps.Marker({
              position: { lat: latitude, lng: longitude },
              map: mapInstanceRef.current,
              draggable: true,
              animation: window.google.maps.Animation.DROP,
            });
          }
        }
        
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('לא הצלחנו לאתר את המיקום שלך. אנא ודא שנתת הרשאה לגישה למיקום.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal" onClick={(e) => e.stopPropagation()}>
        <div className="map-modal-header">
          <h3>בחר מיקום במפה</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="map-container" ref={mapRef}></div>
        
        <div className="map-modal-info">
          {selectedLocation ? (
            <>
              <div className="selected-place">
                <strong>{selectedLocation.name}</strong>
                <span>{selectedLocation.address}</span>
              </div>
              <div className="selected-coords">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </div>
            </>
          ) : (
            <p className="map-hint">לחץ על המפה לבחירת מיקום</p>
          )}
        </div>

        <div className="map-modal-actions">
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={getCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? 'מאתר...' : '📍 המיקום שלי'}
          </button>
          <button 
            type="button"
            className="btn btn-primary"
            onClick={() => selectedLocation && onConfirm(selectedLocation)}
            disabled={!selectedLocation}
          >
            אישור בחירה
          </button>
        </div>
      </div>
    </div>
  );

  // Render via portal to avoid React DOM conflicts
  return ReactDOM.createPortal(modalContent, document.body);
}

// Wrapper component that creates input outside React's control
class GooglePlacesInput extends React.Component {
  constructor(props) {
    super(props);
    this.containerRef = React.createRef();
    this.inputElement = null;
    this.autocomplete = null;
  }

  componentDidMount() {
    this.createInput();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value && this.inputElement) {
      if (this.inputElement.value !== this.props.value) {
        this.inputElement.value = this.props.value || '';
      }
    }
    if (prevProps.disabled !== this.props.disabled && this.inputElement) {
      this.inputElement.disabled = this.props.disabled;
    }
  }

  componentWillUnmount() {
    // Clean up autocomplete listeners first
    if (this.autocomplete && window.google?.maps?.event) {
      try {
        window.google.maps.event.clearInstanceListeners(this.autocomplete);
      } catch (e) {}
    }
    this.autocomplete = null;
    
    // Restore original removeChild if we overrode it
    if (this.containerRef.current && this.containerRef.current._originalRemoveChild) {
      this.containerRef.current.removeChild = this.containerRef.current._originalRemoveChild;
      delete this.containerRef.current._originalRemoveChild;
    }
    
    this.inputElement = null;
  }

  createInput() {
    if (!this.containerRef.current) return;

    // Override removeChild to prevent React errors when Google has modified DOM
    const container = this.containerRef.current;
    if (!container._originalRemoveChild) {
      // Store original for restoration
      container._originalRemoveChild = container.removeChild;
      container.removeChild = function(child) {
        try {
          // Check if child is actually a child of this container
          if (child && child.parentNode === container) {
            return container._originalRemoveChild.call(container, child);
          }
          // If not a child (Google moved it), just return without error
          return child;
        } catch (e) {
          // If removal fails for any reason, just return the child
          // This prevents React from throwing "not a child" errors
          return child;
        }
      };
    }

    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input location-input';
    input.placeholder = this.props.placeholder || 'הקלד כתובת...';
    input.disabled = this.props.disabled || false;
    input.autocomplete = 'off';
    input.value = this.props.value || '';

    // Handle input changes
    input.addEventListener('input', (e) => {
      if (this.props.onChange) {
        this.props.onChange(e.target.value);
      }
    });

    this.containerRef.current.appendChild(input);
    this.inputElement = input;

    // Initialize Google Places Autocomplete after a short delay
    this.initAutocomplete();
  }

  initAutocomplete() {
    if (!isGoogleMapsReady()) {
      // Retry after delay
      setTimeout(() => this.initAutocomplete(), 500);
      return;
    }

    if (!this.inputElement) return;

    try {
      this.autocomplete = new window.google.maps.places.Autocomplete(this.inputElement, {
        componentRestrictions: { country: 'il' },
        fields: ['formatted_address', 'geometry', 'name', 'address_components'],
        types: ['geocode', 'establishment']
      });

      this.autocomplete.addListener('place_changed', () => {
        const place = this.autocomplete.getPlace();
        if (place && place.geometry) {
          const location = {
            address: place.formatted_address || place.name,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            name: this.extractLocalityName(place)
          };
          
          if (this.props.onChange) {
            this.props.onChange(location.address);
          }
          if (this.props.onLocationSelect) {
            this.props.onLocationSelect(location);
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize Places Autocomplete:', error);
    }
  }

  extractLocalityName(place) {
    if (!place.address_components) return place.name || place.formatted_address;
    
    const locality = place.address_components.find(comp => 
      comp.types.includes('locality')
    );
    const sublocality = place.address_components.find(comp => 
      comp.types.includes('sublocality') || comp.types.includes('neighborhood')
    );
    const adminArea = place.address_components.find(comp => 
      comp.types.includes('administrative_area_level_2')
    );
    
    return locality?.long_name || sublocality?.long_name || adminArea?.long_name || place.name;
  }

  render() {
    // Use dangerouslySetInnerHTML to prevent React from managing children
    return (
      <div 
        ref={this.containerRef} 
        className="google-places-input-container"
        style={{ flex: 1, display: 'flex' }}
      />
    );
  }
}

function MapLocationPicker({ 
  value = '', 
  onChange, 
  onLocationSelect,
  placeholder = 'הקלד כתובת...',
  showMap = true,
  compact = false,
  disabled = false 
}) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapsAvailable, setMapsAvailable] = useState(false);
  const [mapsError, setMapsError] = useState(null);
  const isMounted = useRef(true);

  // Track mount state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Check for Google Maps availability
  useEffect(() => {
    const checkMaps = () => {
      if (isGoogleMapsReady()) {
        if (isMounted.current) {
          setMapsAvailable(true);
          setMapsError(null);
        }
        return true;
      }
      return false;
    };

    if (checkMaps()) return;

    let attempts = 0;
    const maxAttempts = 20;
    const interval = setInterval(() => {
      attempts++;
      if (checkMaps() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts && !isGoogleMapsReady() && isMounted.current) {
          setMapsError('Google Maps לא נטען. ניתן להקליד כתובת ידנית.');
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Handle location selection from autocomplete
  const handleLocationSelect = useCallback((location) => {
    if (!isMounted.current) return;
    setSelectedLocation(location);
    onLocationSelect?.(location);
  }, [onLocationSelect]);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('הדפדפן שלך לא תומך באיתור מיקום');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!isMounted.current) return;
        
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=he&key=${GOOGLE_API_KEY}`
          );
          const data = await response.json();
          
          if (!isMounted.current) return;
          
          if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            const addressComponents = result.address_components;
            
            const locality = addressComponents.find(comp => 
              comp.types.includes('locality')
            ) || addressComponents.find(comp => 
              comp.types.includes('administrative_area_level_2')
            );

            const location = {
              address: result.formatted_address,
              lat: latitude,
              lng: longitude,
              name: locality?.long_name || result.formatted_address
            };

            setSelectedLocation(location);
            onChange?.(location.address);
            onLocationSelect?.(location);
          }
        } catch (error) {
          console.error('Reverse geocode error:', error);
        }
        
        setIsLocating(false);
      },
      (error) => {
        if (!isMounted.current) return;
        console.error('Geolocation error:', error);
        alert('לא הצלחנו לאתר את המיקום שלך. אנא ודא שנתת הרשאה לגישה למיקום.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange, onLocationSelect]);

  // Handle map modal confirmation
  const handleMapConfirm = useCallback((location) => {
    setSelectedLocation(location);
    onChange?.(location.address);
    onLocationSelect?.(location);
    setIsMapOpen(false);
  }, [onChange, onLocationSelect]);

  // Open map modal
  const openMap = useCallback(() => {
    if (!mapsAvailable) {
      alert('המפה אינה זמינה. יש להפעיל את Google Maps APIs בקונסולת Google Cloud.');
      return;
    }
    setIsMapOpen(true);
  }, [mapsAvailable]);

  return (
    <div className={`map-location-picker ${compact ? 'compact' : ''}`}>
      <div className="location-input-wrapper">
        <GooglePlacesInput
          value={value}
          onChange={onChange}
          onLocationSelect={handleLocationSelect}
          placeholder={placeholder}
          disabled={disabled}
        />
        <div className="location-buttons">
          <button
            type="button"
            className="location-btn locate-btn"
            onClick={getCurrentLocation}
            disabled={disabled || isLocating}
            title="המיקום שלי"
          >
            {isLocating ? (
              <span className="btn-spinner"></span>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
            )}
          </button>
          {showMap && (
            <button
              type="button"
              className={`location-btn map-btn ${!mapsAvailable ? 'disabled-look' : ''}`}
              onClick={openMap}
              disabled={disabled}
              title={mapsAvailable ? 'בחר במפה' : 'המפה אינה זמינה'}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {mapsError && (
        <div className="maps-error-notice">
          ⚠️ {mapsError}
        </div>
      )}

      {selectedLocation && (
        <div className="selected-location-info">
          <span className="location-name">{selectedLocation.name}</span>
          {selectedLocation.name !== selectedLocation.address && (
            <span className="location-address">{selectedLocation.address}</span>
          )}
        </div>
      )}

      {/* Map Modal - rendered via portal */}
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={handleMapConfirm}
        initialLocation={selectedLocation}
        mapsAvailable={mapsAvailable}
      />
    </div>
  );
}

export default MapLocationPicker;
